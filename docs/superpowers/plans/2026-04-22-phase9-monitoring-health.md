# Phase 9: Monitoring & Health Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add built-in observability — expanded health probes, per-request metrics, and structured error tracking — with no external dependencies.

**Architecture:** `MetricsMiddleware` captures request latency/status into an in-memory `MetricsStore`, exposed via `/metrics`. `HealthService` gains `checkRedis()`, `checkQueue()`, `checkStorage()` behind `/health/live` and `/health/ready` endpoints. `ErrorTrackingService` records error events inside the existing `HttpExceptionFilter`, now registered via `APP_FILTER` for DI.

**Tech Stack:** NestJS middleware, BullMQ queue health check, ioredis ping, StorageService round-trip, pino structured logging

---

## File Map

### Created
- `src/bootstrap/metrics/metrics.store.ts` — in-memory metrics accumulator with percentile computation
- `src/bootstrap/metrics/metrics.store.spec.ts`
- `src/bootstrap/metrics/metrics.middleware.ts` — Express middleware recording request metrics
- `src/bootstrap/metrics/metrics.middleware.spec.ts`
- `src/bootstrap/metrics/metrics.module.ts` — provides MetricsStore, registers middleware + MetricsController
- `src/bootstrap/metrics/metrics.controller.ts` — `/metrics` endpoint
- `src/shared/infrastructure/monitoring/error-tracking.service.ts` — error histogram + structured logging
- `src/shared/infrastructure/monitoring/error-tracking.service.spec.ts`
- `src/shared/infrastructure/monitoring/monitoring.module.ts` — provides ErrorTrackingService, registers HttpExceptionFilter via APP_FILTER

### Modified
- `src/modules/health/health.service.ts` — add checkRedis, checkQueue, checkStorage with 5s timeout
- `src/modules/health/health.service.spec.ts` — tests for new check methods
- `src/modules/health/health.controller.ts` — split into /health/live and /health/ready
- `src/modules/health/health.module.ts` — import QueueModule, StorageModule, RedisModule
- `src/shared/presentation/filters/http-exception.filter.ts` — accept ErrorTrackingService via DI
- `src/shared/presentation/filters/http-exception.filter.spec.ts` — update tests for DI constructor
- `src/main.ts` — remove manual filter registration, import MonitoringModule + MetricsModule

---

## Task 1: MetricsStore (in-memory metrics accumulator)

**Files:**
- Create: `src/bootstrap/metrics/metrics.store.ts`
- Create: `src/bootstrap/metrics/metrics.store.spec.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/bootstrap/metrics/metrics.store.spec.ts
import { MetricsStore } from './metrics.store';

describe('MetricsStore', () => {
  let store: MetricsStore;

  beforeEach(() => {
    store = new MetricsStore();
  });

  it('starts with zero counts', () => {
    const snap = store.snapshot();
    expect(snap.requests.total).toBe(0);
    expect(snap.errors.client4xx).toBe(0);
    expect(snap.errors.server5xx).toBe(0);
  });

  it('records a single request', () => {
    store.record('GET', 200, 10);
    const snap = store.snapshot();
    expect(snap.requests.total).toBe(1);
    expect(snap.requests.byStatus['200']).toBe(1);
    expect(snap.requests.byMethod['GET']).toBe(1);
  });

  it('accumulates multiple requests', () => {
    store.record('GET', 200, 10);
    store.record('GET', 200, 20);
    store.record('POST', 201, 30);
    const snap = store.snapshot();
    expect(snap.requests.total).toBe(3);
    expect(snap.requests.byStatus['200']).toBe(2);
    expect(snap.requests.byStatus['201']).toBe(1);
    expect(snap.requests.byMethod['POST']).toBe(1);
  });

  it('counts 4xx as client errors', () => {
    store.record('GET', 404, 5);
    store.record('POST', 400, 3);
    expect(store.snapshot().errors.client4xx).toBe(2);
  });

  it('counts 5xx as server errors', () => {
    store.record('GET', 500, 5);
    store.record('GET', 503, 3);
    expect(store.snapshot().errors.server5xx).toBe(2);
  });

  it('does not count 3xx as errors', () => {
    store.record('GET', 301, 5);
    const snap = store.snapshot();
    expect(snap.errors.client4xx).toBe(0);
    expect(snap.errors.server5xx).toBe(0);
  });

  it('computes p50/p95/p99 from latency window', () => {
    for (let i = 1; i <= 100; i++) {
      store.record('GET', 200, i);
    }
    const snap = store.snapshot();
    expect(snap.latency.p50).toBe(50);
    expect(snap.latency.p95).toBe(95);
    expect(snap.latency.p99).toBe(99);
  });

  it('uses a sliding window of last 1000 entries', () => {
    for (let i = 1; i <= 1500; i++) {
      store.record('GET', 200, i);
    }
    const snap = store.snapshot();
    expect(snap.requests.total).toBe(1500);
    // p99 should be from the last 1000 values (501..1500), so p99 ≈ 1495
    expect(snap.latency.p99).toBeGreaterThanOrEqual(1490);
  });

  it('resets all counters', () => {
    store.record('GET', 200, 10);
    store.record('GET', 500, 5);
    store.reset();
    const snap = store.snapshot();
    expect(snap.requests.total).toBe(0);
    expect(snap.errors.server5xx).toBe(0);
  });

  it('returns zero percentiles when empty', () => {
    const snap = store.snapshot();
    expect(snap.latency.p50).toBe(0);
    expect(snap.latency.p95).toBe(0);
    expect(snap.latency.p99).toBe(0);
  });

  it('includes uptime in snapshot', () => {
    const snap = store.snapshot();
    expect(typeof snap.uptime).toBe('number');
    expect(snap.uptime).toBeGreaterThanOrEqual(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
bun test src/bootstrap/metrics/metrics.store.spec.ts
```

Expected: FAIL — module does not exist.

- [ ] **Step 3: Create MetricsStore**

```typescript
// src/bootstrap/metrics/metrics.store.ts
import { Injectable, Logger } from '@nestjs/common';

export interface MetricsSnapshot {
  uptime: number;
  requests: {
    total: number;
    byStatus: Record<string, number>;
    byMethod: Record<string, number>;
  };
  latency: { p50: number; p95: number; p99: number };
  errors: { client4xx: number; server5xx: number };
}

const WINDOW_SIZE = 1000;

@Injectable()
export class MetricsStore implements Disposable {
  private readonly logger = new Logger(MetricsStore.name);
  private readonly startTime = Date.now();
  private totalRequests = 0;
  private readonly byStatus: Record<string, number> = {};
  private readonly byMethod: Record<string, number> = {};
  private client4xx = 0;
  private server5xx = 0;
  private readonly latencyWindow: number[] = [];
  private summaryTimer: ReturnType<typeof setInterval> | undefined;

  constructor() {
    this.summaryTimer = setInterval(() => this.logSummary(), 60_000);
  }

  record(method: string, statusCode: number, durationMs: number): void {
    this.totalRequests++;
    this.byStatus[String(statusCode)] =
      (this.byStatus[String(statusCode)] ?? 0) + 1;
    this.byMethod[method] = (this.byMethod[method] ?? 0) + 1;

    if (statusCode >= 400 && statusCode < 500) this.client4xx++;
    if (statusCode >= 500) this.server5xx++;

    this.latencyWindow.push(durationMs);
    if (this.latencyWindow.length > WINDOW_SIZE) {
      this.latencyWindow.shift();
    }
  }

  snapshot(): MetricsSnapshot {
    return {
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      requests: {
        total: this.totalRequests,
        byStatus: { ...this.byStatus },
        byMethod: { ...this.byMethod },
      },
      latency: this.computePercentiles(),
      errors: { client4xx: this.client4xx, server5xx: this.server5xx },
    };
  }

  reset(): void {
    this.totalRequests = 0;
    for (const k of Object.keys(this.byStatus)) delete this.byStatus[k];
    for (const k of Object.keys(this.byMethod)) delete this.byMethod[k];
    this.client4xx = 0;
    this.server5xx = 0;
    this.latencyWindow.length = 0;
  }

  [Symbol.dispose](): void {
    if (this.summaryTimer) clearInterval(this.summaryTimer);
  }

  private computePercentiles(): { p50: number; p95: number; p99: number } {
    if (this.latencyWindow.length === 0) {
      return { p50: 0, p95: 0, p99: 0 };
    }
    const sorted = [...this.latencyWindow].sort((a, b) => a - b);
    return {
      p50: sorted[Math.floor(sorted.length * 0.5)] ?? 0,
      p95: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
      p99: sorted[Math.floor(sorted.length * 0.99)] ?? 0,
    };
  }

  private logSummary(): void {
    const snap = this.snapshot();
    this.logger.log({
      msg: 'metrics summary',
      requests: snap.requests.total,
      errors: snap.errors.client4xx + snap.errors.server5xx,
      p95: snap.latency.p95,
    });
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
bun test src/bootstrap/metrics/metrics.store.spec.ts
```

Expected: all 11 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/bootstrap/metrics/metrics.store.ts src/bootstrap/metrics/metrics.store.spec.ts
git commit -m "feat: add MetricsStore with sliding-window latency and percentile computation"
```

---

## Task 2: MetricsMiddleware

**Files:**
- Create: `src/bootstrap/metrics/metrics.middleware.ts`
- Create: `src/bootstrap/metrics/metrics.middleware.spec.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/bootstrap/metrics/metrics.middleware.spec.ts
import { MetricsStore } from './metrics.store';
import { MetricsMiddleware } from './metrics.middleware';

describe('MetricsMiddleware', () => {
  let store: MetricsStore;
  let middleware: MetricsMiddleware;

  beforeEach(() => {
    store = new MetricsStore();
    middleware = new MetricsMiddleware(store);
  });

  it('records method, status code, and duration on response finish', (done) => {
    const startTime = Date.now();
    const req = { method: 'GET' } as unknown as import('express').Request;
    const res = {
      on: (event: string, cb: () => void) => {
        if (event === 'finish') cb();
      },
      statusCode: 200,
    } as unknown as import('express').Response;
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(next).toHaveBeenCalled();

    // Simulate finish after a small delay (already called by the mock)
    const snap = store.snapshot();
    expect(snap.requests.total).toBe(1);
    expect(snap.requests.byStatus['200']).toBe(1);
    expect(snap.requests.byMethod['GET']).toBe(1);
    expect(snap.latency.p50).toBeGreaterThanOrEqual(0);
    done();
  });

  it('captures 4xx status codes', () => {
    const req = { method: 'POST' } as unknown as import('express').Request;
    const res = {
      on: (event: string, cb: () => void) => {
        if (event === 'finish') cb();
      },
      statusCode: 400,
    } as unknown as import('express').Response;
    middleware.use(req, res, jest.fn());
    expect(store.snapshot().errors.client4xx).toBe(1);
  });

  it('captures 5xx status codes', () => {
    const req = { method: 'GET' } as unknown as import('express').Request;
    const res = {
      on: (event: string, cb: () => void) => {
        if (event === 'finish') cb();
      },
      statusCode: 500,
    } as unknown as import('express').Response;
    middleware.use(req, res, jest.fn());
    expect(store.snapshot().errors.server5xx).toBe(1);
  });

  it('does not record if response never finishes', () => {
    const req = { method: 'GET' } as unknown as import('express').Request;
    const res = {
      on: () => {},
      statusCode: 200,
    } as unknown as import('express').Response;
    middleware.use(req, res, jest.fn());
    expect(store.snapshot().requests.total).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
bun test src/bootstrap/metrics/metrics.middleware.spec.ts
```

- [ ] **Step 3: Create MetricsMiddleware**

```typescript
// src/bootstrap/metrics/metrics.middleware.ts
import { type NestMiddleware, Injectable } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { MetricsStore } from './metrics.store';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly store: MetricsStore) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();

    res.on('finish', () => {
      this.store.record(req.method, res.statusCode, Date.now() - start);
    });

    next();
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
bun test src/bootstrap/metrics/metrics.middleware.spec.ts
```

Expected: all 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/bootstrap/metrics/metrics.middleware.ts src/bootstrap/metrics/metrics.middleware.spec.ts
git commit -m "feat: add MetricsMiddleware recording request metrics into MetricsStore"
```

---

## Task 3: MetricsController + MetricsModule + register in AppModule

**Files:**
- Create: `src/bootstrap/metrics/metrics.controller.ts`
- Create: `src/bootstrap/metrics/metrics.module.ts`
- Modify: `src/app.module.ts`

- [ ] **Step 1: Create MetricsController**

```typescript
// src/bootstrap/metrics/metrics.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { MetricsStore } from './metrics.store';

@ApiTags('metrics')
@Controller('metrics')
@SkipThrottle()
export class MetricsController {
  constructor(private readonly store: MetricsStore) {}

  @Get()
  @ApiOperation({ summary: 'Get request metrics snapshot' })
  getMetrics() {
    return this.store.snapshot();
  }
}
```

- [ ] **Step 2: Create MetricsModule**

```typescript
// src/bootstrap/metrics/metrics.module.ts
import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsMiddleware } from './metrics.middleware';
import { MetricsStore } from './metrics.store';

@Module({
  controllers: [MetricsController],
  providers: [MetricsStore],
  exports: [MetricsStore],
})
export class MetricsModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(MetricsMiddleware).forRoutes('*');
  }
}
```

- [ ] **Step 3: Register MetricsModule in AppModule**

Add `MetricsModule` to the `imports` array in `src/app.module.ts`:

Find:
```typescript
import { SocialModule } from './modules/social/social.module';
```

Add after:
```typescript
import { MetricsModule } from './bootstrap/metrics/metrics.module';
```

Find:
```typescript
    SocialModule,
```

Add after:
```typescript
    MetricsModule,
```

- [ ] **Step 4: Run lint and tests**

```bash
bun run check --write src/bootstrap/metrics/ src/app.module.ts
bun test src/bootstrap/metrics/
```

Expected: lint clean, all MetricsStore + MetricsMiddleware tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/bootstrap/metrics/metrics.controller.ts \
        src/bootstrap/metrics/metrics.module.ts \
        src/app.module.ts
git commit -m "feat: add MetricsController, MetricsModule, and register in AppModule"
```

---

## Task 4: ErrorTrackingService

**Files:**
- Create: `src/shared/infrastructure/monitoring/error-tracking.service.ts`
- Create: `src/shared/infrastructure/monitoring/error-tracking.service.spec.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/shared/infrastructure/monitoring/error-tracking.service.spec.ts
import { ErrorTrackingService } from './error-tracking.service';

describe('ErrorTrackingService', () => {
  let service: ErrorTrackingService;

  beforeEach(() => {
    service = new ErrorTrackingService();
  });

  it('starts with empty summary', () => {
    expect(service.getSummary()).toEqual({});
  });

  it('records a 4xx error in the histogram', () => {
    service.record({
      traceId: 't1',
      method: 'POST',
      path: '/auth/login',
      statusCode: 401,
      message: 'Unauthorized',
      timestamp: '2026-04-22T10:00:00.000Z',
      userId: null,
    });
    const summary = service.getSummary();
    expect(summary['401 POST /auth/login']).toBe(1);
  });

  it('records a 5xx error in the histogram', () => {
    service.record({
      traceId: 't2',
      method: 'GET',
      path: '/users',
      statusCode: 500,
      message: 'Internal server error',
      timestamp: '2026-04-22T10:00:00.000Z',
      userId: 'user-1',
      stack: 'Error: ...\n  at line 10',
    });
    expect(service.getSummary()['500 GET /users']).toBe(1);
  });

  it('accumulates counts for the same error type', () => {
    const ctx = {
      traceId: 't3',
      method: 'GET',
      path: '/health',
      statusCode: 404,
      message: 'Not found',
      timestamp: '2026-04-22T10:00:00.000Z',
      userId: null,
    };
    service.record(ctx);
    service.record(ctx);
    service.record(ctx);
    expect(service.getSummary()['404 GET /health']).toBe(3);
  });

  it('tracks multiple error types independently', () => {
    service.record({
      traceId: 't4',
      method: 'GET',
      path: '/a',
      statusCode: 404,
      message: 'Not found',
      timestamp: '2026-04-22T10:00:00.000Z',
      userId: null,
    });
    service.record({
      traceId: 't5',
      method: 'POST',
      path: '/b',
      statusCode: 500,
      message: 'Error',
      timestamp: '2026-04-22T10:00:00.000Z',
      userId: null,
    });
    const summary = service.getSummary();
    expect(summary['404 GET /a']).toBe(1);
    expect(summary['500 POST /b']).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
bun test src/shared/infrastructure/monitoring/error-tracking.service.spec.ts
```

- [ ] **Step 3: Create ErrorTrackingService**

```typescript
// src/shared/infrastructure/monitoring/error-tracking.service.ts
import { Injectable, Logger } from '@nestjs/common';

export interface ErrorContext {
  traceId: string;
  method: string;
  path: string;
  statusCode: number;
  message: string;
  timestamp: string;
  userId: string | null;
  stack?: string;
}

@Injectable()
export class ErrorTrackingService {
  private readonly logger = new Logger(ErrorTrackingService.name);
  private readonly histogram: Record<string, number> = {};

  record(ctx: ErrorContext): void {
    const key = `${ctx.statusCode} ${ctx.method} ${ctx.path}`;
    this.histogram[key] = (this.histogram[key] ?? 0) + 1;

    const logData = {
      traceId: ctx.traceId,
      method: ctx.method,
      path: ctx.path,
      statusCode: ctx.statusCode,
      message: ctx.message,
      ...(ctx.userId ? { userId: ctx.userId } : {}),
    };

    if (ctx.statusCode >= 500) {
      this.logger.error({ ...logData, stack: ctx.stack });
    } else {
      this.logger.warn(logData);
    }
  }

  getSummary(): Record<string, number> {
    return { ...this.histogram };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
bun test src/shared/infrastructure/monitoring/error-tracking.service.spec.ts
```

Expected: all 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/shared/infrastructure/monitoring/error-tracking.service.ts \
        src/shared/infrastructure/monitoring/error-tracking.service.spec.ts
git commit -m "feat: add ErrorTrackingService with histogram and structured logging"
```

---

## Task 5: MonitoringModule + integrate HttpExceptionFilter via DI

**Files:**
- Create: `src/shared/infrastructure/monitoring/monitoring.module.ts`
- Modify: `src/shared/presentation/filters/http-exception.filter.ts`
- Modify: `src/shared/presentation/filters/http-exception.filter.spec.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Update HttpExceptionFilter to accept ErrorTrackingService via constructor**

Replace the entire file:

```typescript
// src/shared/presentation/filters/http-exception.filter.ts
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ErrorTrackingService } from '../../infrastructure/monitoring/error-tracking.service';
import { traceStore } from '../../../bootstrap/logging/trace.middleware';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(
    @Inject(ErrorTrackingService)
    private readonly errorTracking: ErrorTrackingService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let details: string[] | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const raw = exception.getResponse();

      if (typeof raw === 'string') {
        message = raw;
      } else if (typeof raw === 'object' && raw !== null) {
        const body = raw as Record<string, unknown>;
        const rawMessage = body.message;

        if (Array.isArray(rawMessage)) {
          message = 'Validation failed';
          details = rawMessage as string[];
        } else if (typeof rawMessage === 'string') {
          message = rawMessage;
        }
      }
    } else {
      this.logger.error(
        'Unhandled exception',
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const traceId = traceStore.getStore()?.traceId ?? 'unknown';
    const userId = (request.user as { userId: string } | undefined)?.userId ?? null;

    this.errorTracking.record({
      traceId,
      method: request.method,
      path: request.url,
      statusCode,
      message: typeof message === 'string' ? message : message.join(', '),
      timestamp: new Date().toISOString(),
      userId,
      ...(statusCode >= 500 && exception instanceof Error
        ? { stack: exception.stack }
        : {}),
    });

    response.status(statusCode).json({
      success: false,
      error: {
        statusCode,
        message,
        ...(details && details.length > 0 ? { details } : {}),
      },
      timestamp: new Date().toISOString(),
    });
  }
}
```

- [ ] **Step 2: Update HttpExceptionFilter spec to provide ErrorTrackingService mock**

Replace the entire spec file:

```typescript
// src/shared/presentation/filters/http-exception.filter.spec.ts
import type { ArgumentsHost } from '@nestjs/common';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';
import { ErrorTrackingService } from '../../infrastructure/monitoring/error-tracking.service';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockHost: ArgumentsHost;
  let mockErrorTracking: { record: jest.Mock; getSummary: jest.Mock };

  beforeEach(() => {
    mockErrorTracking = {
      record: jest.fn(),
      getSummary: jest.fn().mockReturnValue({}),
    };
    filter = new HttpExceptionFilter(
      mockErrorTracking as unknown as ErrorTrackingService,
    );
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => ({ status: mockStatus }),
        getRequest: () => ({ method: 'GET', url: '/test', user: undefined }),
        getNext: () => ({}),
      }),
      getArgs: () => [],
      getArgByIndex: () => undefined,
      switchToRpc: () => ({ getData: () => ({}), getContext: () => ({}) }),
      switchToWs: () => ({ getData: () => ({}), getClient: () => ({}) }),
      getType: () => 'http' as const,
    } as unknown as ArgumentsHost;
  });

  it('formats NotFoundException with statusCode and timestamp', () => {
    filter.catch(new NotFoundException('Resource not found'), mockHost);

    expect(mockStatus).toHaveBeenCalledWith(404);
    const payload = mockJson.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.success).toBe(false);
    expect((payload.error as Record<string, unknown>).statusCode).toBe(404);
    expect((payload.error as Record<string, unknown>).message).toBe(
      'Resource not found',
    );
    expect(typeof payload.timestamp).toBe('string');
  });

  it('returns 500 for non-HTTP exceptions without exposing details', () => {
    filter.catch(new Error('Unexpected crash'), mockHost);

    expect(mockStatus).toHaveBeenCalledWith(500);
    const payload = mockJson.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.success).toBe(false);
    expect((payload.error as Record<string, unknown>).statusCode).toBe(500);
    expect((payload.error as Record<string, unknown>).message).toBe(
      'Internal server error',
    );
  });

  it('extracts details[] from ValidationPipe array message', () => {
    filter.catch(
      new BadRequestException({
        message: ['email must be an email', 'password is too short'],
        error: 'Bad Request',
        statusCode: 400,
      }),
      mockHost,
    );

    expect(mockStatus).toHaveBeenCalledWith(400);
    const payload = mockJson.mock.calls[0][0] as Record<string, unknown>;
    const error = payload.error as Record<string, unknown>;
    expect(error.message).toBe('Validation failed');
    expect(error.details).toEqual([
      'email must be an email',
      'password is too short',
    ]);
  });

  it('uses string message directly when not an array', () => {
    filter.catch(
      new HttpException({ message: 'Conflict' }, HttpStatus.CONFLICT),
      mockHost,
    );

    const payload = mockJson.mock.calls[0][0] as Record<string, unknown>;
    const error = payload.error as Record<string, unknown>;
    expect(error.message).toBe('Conflict');
    expect(error.details).toBeUndefined();
  });

  it('calls ErrorTrackingService.record with error context', () => {
    filter.catch(new NotFoundException('Not found'), mockHost);

    expect(mockErrorTracking.record).toHaveBeenCalledTimes(1);
    const call = mockErrorTracking.record.mock.calls[0][0];
    expect(call.statusCode).toBe(404);
    expect(call.method).toBe('GET');
    expect(call.path).toBe('/test');
  });
});
```

- [ ] **Step 3: Run tests to verify they pass**

```bash
bun test src/shared/presentation/filters/http-exception.filter.spec.ts
```

Expected: all 5 tests pass.

- [ ] **Step 4: Create MonitoringModule**

```typescript
// src/shared/infrastructure/monitoring/monitoring.module.ts
import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { HttpExceptionFilter } from '../../presentation/filters/http-exception.filter';
import { ErrorTrackingService } from './error-tracking.service';

@Global()
@Module({
  providers: [
    ErrorTrackingService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
  exports: [ErrorTrackingService],
})
export class MonitoringModule {}
```

- [ ] **Step 5: Update main.ts — remove manual filter registration, import MonitoringModule**

In `src/main.ts`:

Remove the import:
```typescript
import { HttpExceptionFilter } from './shared/presentation/filters/http-exception.filter';
```

Remove the line:
```typescript
  app.useGlobalFilters(new HttpExceptionFilter());
```

Add import:
```typescript
import { MonitoringModule } from './shared/infrastructure/monitoring/monitoring.module';
```

This is not needed in `main.ts` since `MonitoringModule` is `@Global()` — it should be registered in `AppModule` instead.

Add to `src/app.module.ts` imports:
```typescript
import { MonitoringModule } from './shared/infrastructure/monitoring/monitoring.module';
```

And add `MonitoringModule` to the `imports` array in `AppModule`.

The full change in `main.ts` is:
1. Remove the `HttpExceptionFilter` import
2. Remove the `app.useGlobalFilters(new HttpExceptionFilter())` line
3. Add `MonitoringModule` import to `app.module.ts` and add it to imports

- [ ] **Step 6: Run full lint and tests**

```bash
bun run check --write src/
bun test src/shared/presentation/filters/ src/shared/infrastructure/monitoring/
```

- [ ] **Step 7: Commit**

```bash
git add src/shared/infrastructure/monitoring/monitoring.module.ts \
        src/shared/presentation/filters/http-exception.filter.ts \
        src/shared/presentation/filters/http-exception.filter.spec.ts \
        src/main.ts \
        src/app.module.ts
git commit -m "feat: add MonitoringModule with DI-based HttpExceptionFilter and ErrorTrackingService"
```

---

## Task 6: Expand HealthService with checkRedis, checkQueue, checkStorage

**Files:**
- Modify: `src/modules/health/health.service.ts`
- Create: `src/modules/health/health.service.spec.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/modules/health/health.service.spec.ts
import { HealthService } from './health.service';
import { REDIS_CLIENT } from '../../shared/infrastructure/redis/redis.provider';
import { QUEUE_TOKEN } from '../../shared/infrastructure/queue/queue.token';
import { STORAGE_PROVIDER } from '../../shared/infrastructure/storage/storage.token';

describe('HealthService', () => {
  let service: HealthService;
  let mockDb: { run: jest.Mock };
  let mockCache: { set: jest.Mock; get: jest.Mock; del: jest.Mock };
  let mockRedis: { ping: jest.Mock };
  let mockQueue: { isReady: jest.Mock };
  let mockStorage: { upload: jest.Mock; delete: jest.Mock; getUrl: jest.Mock };

  beforeEach(() => {
    mockDb = { run: jest.fn().mockResolvedValue(undefined) };
    mockCache = {
      set: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue('1'),
      del: jest.fn().mockResolvedValue(undefined),
    };
    mockRedis = { ping: jest.fn().mockResolvedValue('PONG') };
    mockQueue = { isReady: jest.fn().mockResolvedValue(true) };
    mockStorage = {
      upload: jest.fn().mockResolvedValue('health-key'),
      delete: jest.fn().mockResolvedValue(undefined),
      getUrl: jest.fn().mockReturnValue('http://localhost/health-check'),
    };

    service = new HealthService(
      mockDb as never,
      mockCache as never,
      mockRedis as never,
      mockQueue as never,
      mockStorage as never,
    );
  });

  describe('checkDb', () => {
    it('returns ok when SELECT 1 succeeds', async () => {
      expect(await service.checkDb()).toBe('ok');
    });

    it('returns error when query fails', async () => {
      mockDb.run.mockRejectedValue(new Error('connection lost'));
      expect(await service.checkDb()).toBe('error');
    });
  });

  describe('checkCache', () => {
    it('returns ok when set/get/del succeeds', async () => {
      expect(await service.checkCache()).toBe('ok');
    });

    it('returns error when cache fails', async () => {
      mockCache.set.mockRejectedValue(new Error('redis down'));
      expect(await service.checkCache()).toBe('error');
    });
  });

  describe('checkRedis', () => {
    it('returns ok when ping succeeds', async () => {
      expect(await service.checkRedis()).toBe('ok');
    });

    it('returns error when ping fails', async () => {
      mockRedis.ping.mockRejectedValue(new Error('no connection'));
      expect(await service.checkRedis()).toBe('error');
    });
  });

  describe('checkQueue', () => {
    it('returns ok when queue is ready', async () => {
      expect(await service.checkQueue()).toBe('ok');
    });

    it('returns error when queue is not ready', async () => {
      mockQueue.isReady.mockRejectedValue(new Error('queue down'));
      expect(await service.checkQueue()).toBe('error');
    });
  });

  describe('checkStorage', () => {
    it('returns ok when upload/delete succeeds', async () => {
      expect(await service.checkStorage()).toBe('ok');
      expect(mockStorage.upload).toHaveBeenCalled();
      expect(mockStorage.delete).toHaveBeenCalled();
    });

    it('returns error when upload fails', async () => {
      mockStorage.upload.mockRejectedValue(new Error('storage down'));
      expect(await service.checkStorage()).toBe('error');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
bun test src/modules/health/health.service.spec.ts
```

- [ ] **Step 3: Update HealthService with new check methods**

Replace the entire file:

```typescript
// src/modules/health/health.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type Redis from 'ioredis';
import type { Queue } from 'bullmq';
import type { CacheService } from '../../shared/infrastructure/cache/cache.service';
import type { IStorageProvider } from '../../shared/infrastructure/storage/providers/storage-provider.interface';
import { DRIZZLE_CLIENT } from '../../shared/infrastructure/database/database.token';
import { REDIS_CLIENT } from '../../shared/infrastructure/redis/redis.provider';
import { QUEUE_TOKEN } from '../../shared/infrastructure/queue/queue.token';
import { STORAGE_PROVIDER } from '../../shared/infrastructure/storage/storage.token';

type HealthStatus = 'ok' | 'error';

const CHECK_TIMEOUT_MS = 5000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    @Inject(DRIZZLE_CLIENT)
    private readonly db: { run: (query: unknown) => unknown },
    private readonly cacheService: CacheService,
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
    @Inject(QUEUE_TOKEN)
    private readonly queue: Queue,
    @Inject(STORAGE_PROVIDER)
    private readonly storage: IStorageProvider,
  ) {}

  async checkDb(): Promise<HealthStatus> {
    try {
      await withTimeout(this.db.run(sql`SELECT 1`), CHECK_TIMEOUT_MS);
      return 'ok';
    } catch (err) {
      this.logger.error('DB health check failed', err);
      return 'error';
    }
  }

  async checkCache(): Promise<HealthStatus> {
    const key = '__health_check__';
    try {
      await withTimeout(
        (async () => {
          await this.cacheService.set(key, '1', 5);
          await this.cacheService.get(key);
          await this.cacheService.del(key);
        })(),
        CHECK_TIMEOUT_MS,
      );
      return 'ok';
    } catch (err) {
      this.logger.error('Cache health check failed', err);
      return 'error';
    }
  }

  async checkRedis(): Promise<HealthStatus> {
    try {
      await withTimeout(this.redis.ping(), CHECK_TIMEOUT_MS);
      return 'ok';
    } catch (err) {
      this.logger.error('Redis health check failed', err);
      return 'error';
    }
  }

  async checkQueue(): Promise<HealthStatus> {
    try {
      await withTimeout(this.queue.isReady(), CHECK_TIMEOUT_MS);
      return 'ok';
    } catch (err) {
      this.logger.error('Queue health check failed', err);
      return 'error';
    }
  }

  async checkStorage(): Promise<HealthStatus> {
    try {
      await withTimeout(
        (async () => {
          const key = '__health_check__.txt';
          await this.storage.upload(key, Buffer.from('ok'), 'text/plain');
          await this.storage.delete(key);
        })(),
        CHECK_TIMEOUT_MS,
      );
      return 'ok';
    } catch (err) {
      this.logger.error('Storage health check failed', err);
      return 'error';
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
bun test src/modules/health/health.service.spec.ts
```

Expected: all 10 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/modules/health/health.service.ts src/modules/health/health.service.spec.ts
git commit -m "feat: expand HealthService with checkRedis, checkQueue, checkStorage and 5s timeouts"
```

---

## Task 7: Update HealthController — /live and /ready endpoints

**Files:**
- Modify: `src/modules/health/health.controller.ts`

- [ ] **Step 1: Replace HealthController**

Replace the entire file:

```typescript
// src/modules/health/health.controller.ts
import {
  Controller,
  Get,
  HttpStatus,
  Res,
  SkipThrottle,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
// biome-ignore lint/style/useImportType: NestJS DI requires runtime class reference
import { HealthService } from './health.service';

interface ReadinessResult {
  status: 'ok' | 'degraded';
  db: 'ok' | 'error';
  cache: 'ok' | 'error';
  queue: 'ok' | 'error';
  storage: 'ok' | 'error';
}

@ApiTags('health')
@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe — is this process responsive?' })
  live(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('ready')
  @ApiOperation({
    summary: 'Readiness probe — are all dependencies healthy?',
  })
  async ready(
    @Res({ passthrough: true }) res: Response,
  ): Promise<ReadinessResult> {
    const [db, cache, queue, storage] = await Promise.all([
      this.healthService.checkDb(),
      this.healthService.checkCache(),
      this.healthService.checkRedis(),
      this.healthService.checkQueue(),
      this.healthService.checkStorage(),
    ].length ? [
      this.healthService.checkDb(),
      this.healthService.checkCache(),
      this.healthService.checkRedis(),
      this.healthService.checkQueue(),
      this.healthService.checkStorage(),
    ] : []);

    const result: ReadinessResult = {
      status: db === 'ok' && cache === 'ok' && queue === 'ok' && storage === 'ok' ? 'ok' : 'degraded',
      db,
      cache,
      queue,
      storage,
    };

    if (result.status === 'degraded') {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }

    return result;
  }
}
```

Wait — the conditional is wrong. Let me simplify:

```typescript
// src/modules/health/health.controller.ts
import {
  Controller,
  Get,
  HttpStatus,
  Res,
  SkipThrottle,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
// biome-ignore lint/style/useImportType: NestJS DI requires runtime class reference
import { HealthService } from './health.service';

interface ReadinessResult {
  status: 'ok' | 'degraded';
  db: 'ok' | 'error';
  cache: 'ok' | 'error';
  queue: 'ok' | 'error';
  storage: 'ok' | 'error';
}

@ApiTags('health')
@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe — is this process responsive?' })
  live(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('ready')
  @ApiOperation({
    summary: 'Readiness probe — are all dependencies healthy?',
  })
  async ready(
    @Res({ passthrough: true }) res: Response,
  ): Promise<ReadinessResult> {
    const [db, cache, queue, storage] = await Promise.all([
      this.healthService.checkDb(),
      this.healthService.checkCache(),
      this.healthService.checkRedis(),
      this.healthService.checkQueue(),
      this.healthService.checkStorage(),
    ]);

    const status =
      db === 'ok' && cache === 'ok' && queue === 'ok' && storage === 'ok'
        ? 'ok'
        : 'degraded';

    if (status === 'degraded') {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }

    return { status, db, cache, queue, storage };
  }
}
```

Wait — `Promise.all` with 5 items returns a 5-tuple but we destructure into 4. Fix:

```typescript
    const [db, cache, redis, queue, storage] = await Promise.all([
      this.healthService.checkDb(),
      this.healthService.checkCache(),
      this.healthService.checkRedis(),
      this.healthService.checkQueue(),
      this.healthService.checkStorage(),
    ]);
```

But the response shape in the spec is `{ db, cache, queue, storage }` — no separate `redis`. The spec table lists Redis as a separate check but the response shape omits it. Looking at the spec section 3.1:

> `{ status, db, cache, queue, storage }`

The `cache` check is already the Redis-backed cache (via CacheService). `checkRedis` is a raw ping of the Redis instance. We should keep both in the code but only expose `cache` in the response (the cache check implicitly validates Redis). Or we can add `redis` to the response.

**Decision:** Follow the spec exactly — 5 checks run internally, but the response includes `cache` (which covers Redis at the app level). If the raw Redis ping fails but the cache works, it's still `ok`. This avoids confusing operators with duplicate Redis indicators.

So the destructuring stays as 5 items, but the response uses `cache` only:

```typescript
    const [db, cache, _redis, queue, storage] = await Promise.all([...]);

    const status =
      db === 'ok' && cache === 'ok' && queue === 'ok' && storage === 'ok'
        ? 'ok'
        : 'degraded';

    return { status, db, cache, queue, storage };
```

- [ ] **Step 2: Update HealthModule — import QueueModule, StorageModule, RedisModule**

Replace `src/modules/health/health.module.ts`:

```typescript
// src/modules/health/health.module.ts
import { Module } from '@nestjs/common';
import { AppCacheModule } from '../../shared/infrastructure/cache/cache.module';
import { DatabaseModule } from '../../shared/infrastructure/database/database.module';
import { QueueModule } from '../../shared/infrastructure/queue/queue.module';
import { RedisModule } from '../../shared/infrastructure/redis/redis.module';
import { StorageModule } from '../../shared/infrastructure/storage/storage.module';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [DatabaseModule, AppCacheModule, RedisModule, QueueModule, StorageModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
```

- [ ] **Step 3: Run lint and tests**

```bash
bun run check --write src/modules/health/
bun test src/modules/health/
```

- [ ] **Step 4: Commit**

```bash
git add src/modules/health/health.controller.ts src/modules/health/health.module.ts
git commit -m "feat: split health into /live and /ready with Redis, queue, and storage checks"
```

---

## Task 8: Wire error histogram into /metrics endpoint

**Files:**
- Modify: `src/bootstrap/metrics/metrics.store.ts`
- Modify: `src/bootstrap/metrics/metrics.controller.ts`
- Modify: `src/bootstrap/metrics/metrics.module.ts`

The `/metrics` endpoint needs to include `errors.byType` from `ErrorTrackingService`. Since `ErrorTrackingService` lives in `MonitoringModule` (global), we can inject it into `MetricsController`.

- [ ] **Step 1: Update MetricsSnapshot to include errors.byType**

In `src/bootstrap/metrics/metrics.store.ts`, update the `MetricsSnapshot` interface:

Find:
```typescript
export interface MetricsSnapshot {
  uptime: number;
  requests: {
    total: number;
    byStatus: Record<string, number>;
    byMethod: Record<string, number>;
  };
  latency: { p50: number; p95: number; p99: number };
  errors: { client4xx: number; server5xx: number };
}
```

Replace with:
```typescript
export interface MetricsSnapshot {
  uptime: number;
  requests: {
    total: number;
    byStatus: Record<string, number>;
    byMethod: Record<string, number>;
  };
  latency: { p50: number; p95: number; p99: number };
  errors: {
    client4xx: number;
    server5xx: number;
    byType: Record<string, number>;
  };
}
```

In `snapshot()`, update the return value to include `byType: {}` as a placeholder (the controller will merge in the real data from ErrorTrackingService):

Find:
```typescript
      errors: { client4xx: this.client4xx, server5xx: this.server5xx },
```

Replace with:
```typescript
      errors: { client4xx: this.client4xx, server5xx: this.server5xx, byType: {} },
```

- [ ] **Step 2: Update MetricsController to inject ErrorTrackingService**

Replace `src/bootstrap/metrics/metrics.controller.ts`:

```typescript
// src/bootstrap/metrics/metrics.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ErrorTrackingService } from '../../shared/infrastructure/monitoring/error-tracking.service';
import { MetricsStore } from './metrics.store';

@ApiTags('metrics')
@Controller('metrics')
@SkipThrottle()
export class MetricsController {
  constructor(
    private readonly store: MetricsStore,
    private readonly errorTracking: ErrorTrackingService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get request metrics snapshot' })
  getMetrics() {
    const snap = this.store.snapshot();
    return {
      ...snap,
      errors: {
        ...snap.errors,
        byType: this.errorTracking.getSummary(),
      },
    };
  }
}
```

- [ ] **Step 3: Run tests**

```bash
bun test src/bootstrap/metrics/
```

- [ ] **Step 4: Commit**

```bash
git add src/bootstrap/metrics/metrics.store.ts \
        src/bootstrap/metrics/metrics.controller.ts
git commit -m "feat: wire error histogram from ErrorTrackingService into /metrics endpoint"
```

---

## Task 9: Final verification

- [ ] **Step 1: Run full lint**

```bash
bun run check --write src/
```

Fix any remaining lint issues.

- [ ] **Step 2: Run all new tests**

```bash
bun test src/bootstrap/metrics/ src/shared/infrastructure/monitoring/ src/modules/health/ src/shared/presentation/filters/
```

Expected: all new tests pass.

- [ ] **Step 3: Run full test suite**

```bash
bun test src/
```

Note: Pre-existing failures in email, S3, files, and image modules are expected and unrelated to Phase 9.

- [ ] **Step 4: Final commit**

```bash
git commit --allow-empty -m "chore: Phase 9 complete — monitoring & health layer"
```

---

## Acceptance Verification

After all tasks:

- [ ] `GET /health/live` returns `200 { status: "ok" }`
- [ ] `GET /health/ready` returns `200` with all `ok` when deps are healthy, `503` when any fails
- [ ] `GET /metrics` returns JSON with `requests`, `latency`, `errors` including `byType` histogram
- [ ] 4xx errors log at `warn` level with trace ID, no stack trace
- [ ] 5xx errors log at `error` level with trace ID and stack trace
- [ ] Periodic metrics summary logged every 60 seconds via pino
