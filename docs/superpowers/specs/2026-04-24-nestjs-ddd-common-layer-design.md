# NestJS DDD Bootstrap M1 DDD Common Layer Design

## 1. Overview

M1 builds the common DDD and HTTP platform layer for the NestJS bootstrap project. The
goal is to make future modules follow the same boundaries from the start: domain and
application errors stay framework-independent, presentation concerns are centralized,
and every API can share response, error, trace, logging, pagination, and basic security
behavior.

This milestone intentionally avoids database, users, authentication, JWT, and RBAC
logic. Those remain in M2 through M4. M1 provides the foundation those milestones will
reuse.

## 2. Goals

- Create a `shared` structure that reflects DDD layer boundaries.
- Apply a standard success and error response envelope to all APIs.
- Add trace id propagation through request headers, response headers, and response
  metadata.
- Add request logging with method, path, status code, duration, and trace id.
- Add base domain and application error types without depending on NestJS.
- Add reusable pagination types and helpers for later list endpoints.
- Add basic security bootstrap for Helmet, CORS, and rate limiting.
- Refactor the health module into the smallest useful DDD-style example.
- Cover the common pipeline with focused unit and e2e tests.

## 3. Non-Goals

- Do not implement Drizzle, SQLite, PostgreSQL, migrations, or repository adapters.
- Do not implement users CRUD.
- Do not implement auth, JWT, refresh tokens, RBAC, or OAuth.
- Do not add domain-specific business errors beyond generic base examples.
- Do not add Docker, deployment, or production migration workflows.

## 4. Architecture

M1 adds common layer directories and bootstrap setup while keeping the current app
composition simple.

```text
src/
  bootstrap/
    logging/
    security/

  shared/
    domain/
      errors/
    application/
      errors/
      pagination/
    infrastructure/
      logging/
    presentation/
      decorators/
      filters/
      interceptors/
      middleware/
      responses/

  modules/
    health/
      application/
      presentation/
```

`shared/domain` contains pure domain primitives such as base domain errors. It must not
import NestJS, HTTP DTOs, config services, or infrastructure packages.

`shared/application` contains use case level primitives such as application errors and
pagination contracts. It can depend on domain types but must not depend on NestJS
presentation concerns.

`shared/infrastructure` contains technical adapters shared across modules. In M1 this is
limited to logging implementation around Nest's logger.

`shared/presentation` contains HTTP-facing reusable pieces: response envelopes,
exception filters, interceptors, middleware, and decorators.

`bootstrap/logging` and `bootstrap/security` contain app startup functions that compose
global behavior. They should not hold business logic.

The health module is refactored only as far as the current feature needs. It will have
`application` and `presentation` layers. A domain layer is not created until there is a
real domain rule to protect.

## 5. Components

### 5.1 Response Envelope

Successful API responses use this shape:

```json
{
  "data": {},
  "meta": {
    "traceId": "..."
  }
}
```

Paginated responses use this shape:

```json
{
  "data": [],
  "meta": {
    "traceId": "...",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

Error responses use this shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": []
  },
  "meta": {
    "traceId": "..."
  }
}
```

The response envelope is applied through a global interceptor for successful responses
and a global exception filter for error responses.

### 5.2 Trace Id

Trace id handling follows these rules:

- If the request has an `x-trace-id` header, reuse it.
- If the header is missing or empty, create a new `crypto.randomUUID()` value.
- Store the trace id on the request object for downstream middleware, filters, and
  interceptors.
- Set the same value on the response `x-trace-id` header.
- Include the same value in `meta.traceId` for success and error envelopes.

M1 includes a `TraceId` presentation decorator for controllers that need direct trace id
access. Normal envelope behavior must not depend on controllers using this decorator.

### 5.3 Request Logging

Request logging records one completion log entry per request with:

- HTTP method
- original path
- status code
- duration in milliseconds
- trace id

The logger is represented by a small app logger abstraction in `shared/infrastructure`
so later milestones can replace the implementation with structured logging without
changing controllers or use cases. M1 can back this abstraction with Nest's built-in
`Logger`.

### 5.4 Exception Filter

The global exception filter maps known error types to standard HTTP responses:

- `DomainError`
- `ApplicationError`
- Nest `HttpException`
- validation errors generated by the global validation pipe
- unknown errors

Unknown errors must not expose internal messages in the HTTP response.

### 5.5 Security Bootstrap

M1 adds basic HTTP security setup:

- Helmet
- CORS
- rate limiting

Security configuration belongs under `bootstrap/security`. This milestone only covers
HTTP platform hardening. Authentication and authorization remain in M4.

Security configuration uses small environment-driven defaults:

- `CORS_ENABLED`
- `CORS_ORIGIN`
- `RATE_LIMIT_TTL_SECONDS`
- `RATE_LIMIT_MAX`

Development defaults should allow local API exploration. Production can tighten the
same settings without changing code.

### 5.6 Health Module Refactor

The health module becomes the first small example of the intended module flow:

```text
HealthController -> GetHealthStatusUseCase
```

The use case returns pure data:

```json
{
  "status": "ok"
}
```

The HTTP response becomes enveloped by the global interceptor:

```json
{
  "data": {
    "status": "ok"
  },
  "meta": {
    "traceId": "..."
  }
}
```

## 6. Request Flow

The successful request path is:

```text
request
  -> security middleware / Nest platform middleware
  -> trace id middleware
  -> request logging middleware
  -> validation pipe
  -> controller
  -> application use case
  -> response envelope interceptor
  -> response
```

The error path is:

```text
request
  -> validation, controller, application, or domain error
  -> global exception filter
  -> standard error envelope
  -> response
```

The request logging middleware should record final status and duration for both success
and error responses.

## 7. Error Handling

M1 uses framework-independent error classes and a presentation-layer mapper.

`DomainError` represents business rule failures. It contains a stable code, a safe
message, a category, and optional details. It does not contain an HTTP status.

`ApplicationError` represents use case failures such as not found, conflict,
unauthorized, or forbidden operation. It contains a stable code, a safe message, and
optional details. It uses explicit application categories and does not directly depend
on NestJS.

The presentation error mapper assigns HTTP status codes:

```text
DomainError category VALIDATION -> 400
DomainError category CONFLICT -> 409
ApplicationError category NOT_FOUND -> 404
ApplicationError category CONFLICT -> 409
ApplicationError category UNAUTHORIZED -> 401
ApplicationError category FORBIDDEN -> 403
HttpException -> original status
Unknown Error -> 500
```

Validation errors are standardized as:

```text
status: 400
code: VALIDATION_ERROR
message: Request validation failed
```

Unknown errors are standardized as:

```text
status: 500
code: INTERNAL_SERVER_ERROR
message: Internal server error
```

## 8. Pagination

M1 adds pagination contracts without a database implementation.

The application layer should expose:

- `PaginationQuery`
- `PaginationMeta`
- `PaginatedResult<T>`
- helper for normalizing page and limit
- helper for calculating total pages

Later modules can return `PaginatedResult<T>` from application use cases. The response
interceptor can then emit `data` and `meta.pagination` consistently.

Default pagination behavior:

- default page: `1`
- default limit: `20`
- minimum page: `1`
- minimum limit: `1`
- maximum limit: `100`

## 9. Testing

M1 testing focuses on proving the common HTTP pipeline.

### E2E Tests

Update the health e2e test to expect the success envelope:

```json
{
  "data": {
    "status": "ok"
  },
  "meta": {
    "traceId": "..."
  }
}
```

Add an e2e assertion that a provided `x-trace-id` request header is echoed in both the
response header and `meta.traceId`.

### Unit Tests

Add focused unit tests for:

- exception filter mapping for `ApplicationError`
- exception filter mapping for `DomainError`
- exception filter mapping for `HttpException`
- exception filter mapping for unknown errors
- pagination default values
- pagination total page calculation
- pagination max limit handling

Validation e2e coverage can wait for M3, where a real public input endpoint exists.
M1 should not add production-only test endpoints.

## 10. Acceptance Criteria

- `src/shared` exists with clear domain, application, infrastructure, and presentation
  boundaries.
- All successful HTTP responses are returned as `{ data, meta }`.
- All error HTTP responses are returned as `{ error, meta }`.
- Trace id is generated or reused, emitted in the response header, and included in
  response metadata.
- Request logs include method, path, status code, duration, and trace id.
- Basic Helmet, CORS, and rate limiting setup is applied at bootstrap.
- Health is refactored through an application use case and still reports app status.
- Pagination helpers and types are available for future list endpoints.
- `bun run check`, `bun run build`, `bun run test`, and `bun run test:e2e` pass.

## 11. Implementation Notes

- Keep public DTOs and HTTP behavior under `presentation`.
- Keep domain and application errors independent from NestJS.
- Avoid creating placeholder domain layers for modules that do not have domain rules.
- Keep security bootstrap configurable but small.
- Do not introduce database or auth dependencies in M1.
