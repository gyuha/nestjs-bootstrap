# Phase 9: Monitoring & Health Design

**Date:** 2026-04-22
**Status:** Approved
**Scope:** Health checks (liveness/readiness), request metrics middleware, error tracking service

---

## 1. Overview

Phase 9 adds a built-in observability layer: expanded health probes, per-request metrics collection, and structured error tracking. No external services (Prometheus, Sentry, Grafana) are required — everything is self-contained with in-memory storage and pino logging. The existing trace middleware (`X-Trace-Id`) ties everything together.

**Approach:** Middleware-based metrics + direct health service expansion + error tracking service injected into the existing `HttpExceptionFilter`.

---

## 2. Architecture

```
Request → TraceMiddleware → MetricsMiddleware → Route Handler → Response
                                    ↓                                ↓
                              MetricsStore                  HttpExceptionFilter
                                    ↓                                ↓
                              /metrics endpoint          ErrorTrackingService
                                    ↓                                ↓
                              Periodic pino summary    Structured error log + histogram
```

All observability components live in:
- `src/bootstrap/metrics/` — metrics middleware and store
- `src/shared/infrastructure/monitoring/` — error tracking service
- `src/modules/health/` — expanded health checks (existing)

---

## 3. Health Checks

### 3.1 Endpoints

**`GET /health/live`** — Liveness probe
- Always returns `200 { status: "ok" }` when the Node.js process is responsive
- No dependency checks — answers "is this process alive?"
- `@SkipThrottle()` to avoid rate-limit interference

**`GET /health/ready`** — Readiness probe
- Checks all infrastructure dependencies: DB, cache (Redis), queue worker, storage
- Returns `200` when all pass, `503` when any fail
- Response shape: `{ status: "ok" | "degraded", db: "ok" | "error", cache: "ok" | "error", queue: "ok" | "error", storage: "ok" | "error" }`
- Each check has a 5-second timeout to prevent hanging

### 3.2 Health check methods

| Method | What it checks |
|--------|---------------|
| `checkDb()` | `SELECT 1` via Drizzle (existing) |
| `checkCache()` | Set/get/delete round-trip via `CacheService` (existing) |
| `checkRedis()` | Ping the Redis instance via `RedisModule` provider |
| `checkQueue()` | Check BullMQ queue is accepting jobs via `QueueService` |
| `checkStorage()` | Write/read/delete a tiny health-check file via `StorageService` |

### 3.3 File changes

- Modify `src/modules/health/health.service.ts` — add `checkRedis()`, `checkQueue()`, `checkStorage()` methods with 5s timeout
- Modify `src/modules/health/health.controller.ts` — split into `/health/live` and `/health/ready` routes
- Modify `src/modules/health/health.module.ts` — import `RedisModule`, `QueueModule`, `StorageModule`

---

## 4. Request Metrics

### 4.1 MetricsMiddleware

A global middleware registered in `main.ts` via `app.use()` (or via `AppModule` middleware consumer). Wraps every HTTP request:

- Records `method`, `statusCode`, `durationMs` for each completed request
- Calls `MetricsStore.record(method, statusCode, durationMs)`

### 4.2 MetricsStore (in-memory)

Stores in memory with these data structures:
- `requests.total: number` — total request count
- `requests.byStatus: Record<string, number>` — e.g. `{ "200": 152, "404": 3 }`
- `requests.byMethod: Record<string, number>` — e.g. `{ "GET": 120, "POST": 35 }`
- `latencyWindow: number[]` — sliding window of last 1000 request durations (ms)
- `errors.client4xx: number` — count of 4xx responses
- `errors.server5xx: number` — count of 5xx responses

Methods:
- `record(method: string, statusCode: number, durationMs: number): void`
- `snapshot(): MetricsSnapshot` — returns current state with computed p50/p95/p99
- `reset(): void` — zeroes all counters

Percentiles computed from `latencyWindow`:
- Sort the window, pick index at 50%, 95%, 99%

### 4.3 `/metrics` endpoint

Returns JSON snapshot:

```json
{
  "uptime": 3600,
  "requests": {
    "total": 1000,
    "byStatus": { "200": 950, "404": 30, "500": 2 },
    "byMethod": { "GET": 800, "POST": 200 }
  },
  "latency": { "p50": 12, "p95": 45, "p99": 120 },
  "errors": { "client4xx": 47, "server5xx": 2, "byType": { "401 POST /auth/login": 23 } }
}
```

The `errors.byType` field comes from `ErrorTrackingService.getSummary()`.

### 4.4 Periodic summary logging

Every 60 seconds, log a structured summary via pino:
```json
{ "msg": "metrics summary", "requests": 1000, "errors": 5, "p95": 45 }
```

Uses `setInterval` started in `MetricsStore` constructor. Cleared on `onModuleDestroy()`.

### 4.5 Files

- Create `src/bootstrap/metrics/metrics.middleware.ts`
- Create `src/bootstrap/metrics/metrics.store.ts`
- Create `src/bootstrap/metrics/metrics.middleware.spec.ts`
- Create `src/bootstrap/metrics/metrics.store.spec.ts`
- Create `src/bootstrap/metrics/metrics.module.ts` — provides MetricsStore, registers middleware
- Modify `src/main.ts` — import and register MetricsModule

---

## 5. Error Tracking

### 5.1 ErrorTrackingService

An injectable service that records error events with full context:

**Recorded fields per error:**
- `traceId` — from `traceStore` (`AsyncLocalStorage`)
- `method` + `path` — HTTP method and route path
- `statusCode` — HTTP status code
- `message` — error message
- `timestamp` — ISO string
- `userId` — authenticated user ID (if available, null otherwise)
- `stack` — stack trace (5xx only, omitted for 4xx)

**Error histogram (in-memory):**
- Counts by `statusCode METHOD /path` pattern
- Example: `{ "401 POST /auth/login": 23, "404 GET /users/abc": 5 }`
- Exposed via `getSummary(): Record<string, number>`

**Logging behavior:**
- 4xx: `logger.warn({ traceId, method, path, statusCode, message })` — no stack
- 5xx: `logger.error({ traceId, method, path, statusCode, message, stack })` — full context

### 5.2 Integration with HttpExceptionFilter

`HttpExceptionFilter` already catches all exceptions globally. Modify it to:
1. Extract request context from `ArgumentsHost` (method, path, user)
2. Call `ErrorTrackingService.record(context)` before sending the response
3. The filter is registered globally via `app.useGlobalFilters()`, so we need to make it DI-compatible or pass the service directly

Since the filter is currently instantiated with `new HttpExceptionFilter()` in `main.ts`, we have two options:
- **Option A**: Convert to module-based registration (use `APP_FILTER` token) so NestJS DI injects `ErrorTrackingService`
- **Option B**: Pass `ErrorTrackingService` instance manually to the filter constructor

**Chosen: Option A** — register via `APP_FILTER` provider token in a module. This is the idiomatic NestJS pattern and makes the filter fully DI-compatible.

### 5.3 Files

- Create `src/shared/infrastructure/monitoring/error-tracking.service.ts`
- Create `src/shared/infrastructure/monitoring/error-tracking.service.spec.ts`
- Create `src/shared/infrastructure/monitoring/monitoring.module.ts` — provides `ErrorTrackingService` and registers `HttpExceptionFilter` via `APP_FILTER`
- Modify `src/shared/presentation/filters/http-exception.filter.ts` — accept `ErrorTrackingService` via constructor injection, call `record()` in `catch()`
- Modify `src/main.ts` — remove manual `app.useGlobalFilters(new HttpExceptionFilter())`, let the module handle it

---

## 6. File Map Summary

### New files
```
src/bootstrap/metrics/
  metrics.middleware.ts
  metrics.middleware.spec.ts
  metrics.store.ts
  metrics.store.spec.ts
  metrics.module.ts
src/shared/infrastructure/monitoring/
  error-tracking.service.ts
  error-tracking.service.spec.ts
  monitoring.module.ts
```

### Modified files
```
src/modules/health/health.service.ts        — add checkRedis, checkQueue, checkStorage
src/modules/health/health.controller.ts     — split into /live and /ready
src/modules/health/health.module.ts          — import Redis, Queue, Storage modules
src/shared/presentation/filters/http-exception.filter.ts — inject ErrorTrackingService
src/main.ts                                  — register MetricsModule, remove manual filter registration
```

---

## 7. Testing Strategy

- `MetricsStore`: unit tests for `record()`, `snapshot()`, percentile calculations, sliding window behavior
- `MetricsMiddleware`: integration-style test with mock request/response cycle, verify store receives data
- `ErrorTrackingService`: unit tests for `record()` with 4xx vs 5xx logging, histogram accumulation, `getSummary()`
- `HealthService`: unit tests for new check methods with mocked service dependencies, timeout behavior
- `HealthController`: verify `/live` returns 200, `/ready` returns 200/503 based on dependency status

---

## 8. Out of Scope

- External monitoring integrations (Prometheus, Grafana, Sentry, DataDog)
- Distributed tracing beyond the existing `X-Trace-Id`
- Alerting rules or notification hooks
- Performance profiling or flame graphs
- WebSocket event metrics (HTTP only)
