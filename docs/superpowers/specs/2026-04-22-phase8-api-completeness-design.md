# Phase 8: API Completeness Design

**Date:** 2026-04-22  
**Status:** Approved  
**Scope:** Standard response envelope, global exception filter, pagination helpers, common utilities, Swagger integration

---

## 1. Overview

Phase 8 adds the API completeness layer: a consistent response envelope for all HTTP endpoints, a global exception filter, offset + cursor pagination, a suite of shared utilities, and Swagger decorators that reflect the new response shapes. No new domain features are added — this phase makes the existing API production-ready.

**Approach:** `TransformInterceptor` + `HttpExceptionFilter` registered globally in `main.ts`. Utilities are pure named-export functions with no NestJS DI involvement.

---

## 2. Architecture & File Map

### New files

```
src/shared/presentation/
  interceptors/
    transform.interceptor.ts
    transform.interceptor.spec.ts
  filters/
    http-exception.filter.ts
    http-exception.filter.spec.ts
  decorators/
    skip-transform.decorator.ts

src/shared/dto/
  api-response.dto.ts
  pagination.dto.ts
  paginated-response.dto.ts

src/shared/utils/
  date.util.ts + date.util.spec.ts
  uuid.util.ts + uuid.util.spec.ts
  env.util.ts  + env.util.spec.ts
  hash.util.ts + hash.util.spec.ts
  string.util.ts + string.util.spec.ts
  file.util.ts + file.util.spec.ts
  array.util.ts + array.util.spec.ts
  retry.util.ts + retry.util.spec.ts

src/shared/decorators/validation/
  is-uuid.decorator.ts
  is-slug.decorator.ts
  is-past-date.decorator.ts
  is-strong-password.decorator.ts

src/bootstrap/swagger/
  swagger-response.decorator.ts    ← ApiWrappedResponse, ApiOffsetPaginatedResponse, ApiCursorPaginatedResponse
```

### Modified files

```
src/main.ts                         ← register global interceptor + filter
src/bootstrap/swagger/swagger.setup.ts ← add global error response schemas
src/modules/auth/auth.controller.ts
src/modules/users/users.controller.ts
src/modules/users/roles.controller.ts
src/modules/files/files.controller.ts
```

---

## 3. Response Envelope

### 3.1 Success response

```typescript
interface ApiResponse<T> {
  success: true;
  data: T;
  timestamp: string; // ISO 8601
}
```

Example:
```json
{
  "success": true,
  "data": { "id": "uuid", "email": "user@example.com" },
  "timestamp": "2026-04-22T10:00:00.000Z"
}
```

### 3.2 Error response

```typescript
interface ApiErrorResponse {
  success: false;
  error: {
    statusCode: number;
    message: string | string[];
    details?: string[]; // class-validator error array, omitted if empty
  };
  timestamp: string;
}
```

Example:
```json
{
  "success": false,
  "error": {
    "statusCode": 400,
    "message": "Validation failed",
    "details": ["email must be an email", "password must be at least 8 characters"]
  },
  "timestamp": "2026-04-22T10:00:00.000Z"
}
```

Unexpected errors (non-HttpException) map to `500` with message `"Internal server error"` — original error is logged but not exposed to the client.

### 3.3 Offset pagination response

```typescript
interface OffsetPaginatedResponse<T> {
  success: true;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}
```

### 3.4 Cursor pagination response

```typescript
interface CursorPaginatedResponse<T> {
  success: true;
  data: T[];
  meta: {
    nextCursor: string | null;
    hasMore: boolean;
  };
  timestamp: string;
}
```

---

## 4. TransformInterceptor

- Registered globally via `APP_INTERCEPTOR` in `main.ts`
- Wraps `Observable` return value in `ApiResponse<T>` envelope
- **Skip condition:** handler or controller is decorated with `@SkipTransform()` — used on WebSocket gateways (`AppGateway`, `ChatGateway`) and any streaming endpoints
- **Double-wrap guard:** if the value already has `success` property (already an `ApiResponse`), pass through unchanged
- Does not affect `null` / `undefined` returns — wrapped as `{ success: true, data: null, timestamp }`

```typescript
// Usage in controller to opt out:
@SkipTransform()
@SubscribeMessage('chat.message')
handleMessage(...) {}
```

---

## 5. HttpExceptionFilter

- Registered globally via `APP_FILTER` in `main.ts`
- Catches all `HttpException` instances and transforms them into `ApiErrorResponse`
- Catches unknown errors (non-HttpException) → logs with `Logger`, returns `500`
- Extracts `details` array from `ValidationPipe` errors (`exception.getResponse().message` when it's an array)

---

## 6. Pagination DTOs

### OffsetPaginationQuery

```typescript
class OffsetPaginationQuery {
  @IsOptional() @IsInt() @Min(1) page: number = 1;
  @IsOptional() @IsInt() @Min(1) @Max(100) limit: number = 20;
}
```

### CursorPaginationQuery

```typescript
class CursorPaginationQuery {
  @IsOptional() @IsString() cursor?: string;
  @IsOptional() @IsInt() @Min(1) @Max(100) limit: number = 20;
}
```

### Helper function

```typescript
// src/shared/utils/pagination.util.ts
function paginateOffset<T>(data: T[], total: number, query: OffsetPaginationQuery): OffsetPaginatedResponse<T>
function paginateCursor<T>(data: T[], nextCursor: string | null, query: CursorPaginationQuery): CursorPaginatedResponse<T>
```

Controllers call these helpers and return the result directly — `TransformInterceptor` detects the `meta` field and skips re-wrapping the `data` array.

---

## 7. Common Utilities

All utilities are pure named-export functions. No class, no DI, no side effects.

### date.util.ts
```typescript
formatDate(date: Date, format: string): string
addDays(date: Date, days: number): Date
subtractDays(date: Date, days: number): Date
isExpired(date: Date): boolean        // date < now
diffInDays(a: Date, b: Date): number
toISOString(date: Date): string
```

### uuid.util.ts
```typescript
generateUuid(): string   // crypto.randomUUID()
isValidUuid(str: string): boolean
```

### env.util.ts
```typescript
requireEnv(key: string): string        // throws if missing
getEnvOrDefault(key: string, fallback: string): string
```

### hash.util.ts
```typescript
hashPassword(plain: string): Promise<string>    // argon2.hash wrapper
verifyPassword(plain: string, hash: string): Promise<boolean>
```

### string.util.ts
```typescript
toSlug(str: string): string             // "Hello World" → "hello-world"
truncate(str: string, max: number): string  // adds "..." if over
maskEmail(email: string): string        // "john@example.com" → "j***@example.com"
capitalize(str: string): string
camelToSnake(str: string): string
snakeToCamel(str: string): string
```

### file.util.ts
```typescript
getMimeType(filename: string): string
getExtension(filename: string): string
formatFileSize(bytes: number): string   // "1.5 MB"
isImageFile(filename: string): boolean
```

### array.util.ts
```typescript
chunk<T>(arr: T[], size: number): T[][]
dedupe<T>(arr: T[], key?: keyof T): T[]
groupBy<T>(arr: T[], key: keyof T): Record<string, T[]>
flatten<T>(arr: T[][]): T[]
```

### retry.util.ts
```typescript
interface RetryOptions {
  attempts: number;       // default: 3
  delayMs: number;        // default: 500
  backoff: 'linear' | 'exponential'; // default: 'exponential'
}
retry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>
```

---

## 8. Validation Decorators

Placed in `src/shared/decorators/validation/`. Each wraps `registerDecorator` from `class-validator`.

| Decorator | Rule |
|-----------|------|
| `@IsUuid()` | UUID v4 format |
| `@IsSlug()` | `/^[a-z0-9]+(?:-[a-z0-9]+)*$/` |
| `@IsPastDate()` | `date < new Date()` |
| `@IsStrongPassword()` | min 8 chars, 1 number, 1 special char |

---

## 9. Swagger Integration

### Custom response decorators

```typescript
// src/bootstrap/swagger/swagger-response.decorator.ts

@ApiWrappedResponse(UserDto)
// Generates: ApiOkResponse({ schema: { properties: { success: true, data: UserDto schema, timestamp: string } } })

@ApiOffsetPaginatedResponse(UserDto)
// Generates envelope with data: UserDto[] and meta: OffsetMeta

@ApiCursorPaginatedResponse(UserDto)
// Generates envelope with data: UserDto[] and meta: CursorMeta
```

### Global error schemas

In `swagger.setup.ts`, add `@ApiResponse` for standard error codes on the Swagger document builder:
- `400 Bad Request` — validation error shape
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`
- `500 Internal Server Error`

### Controller updates

Replace existing `@ApiOkResponse` decorators in `auth.controller.ts`, `users.controller.ts`, `roles.controller.ts`, `files.controller.ts` with the new `@ApiWrappedResponse` / `@ApiOffsetPaginatedResponse` equivalents.

---

## 10. Testing Strategy

| File | What is tested |
|------|----------------|
| `transform.interceptor.spec.ts` | Wraps plain value, skips with `@SkipTransform`, prevents double-wrap |
| `http-exception.filter.spec.ts` | `BadRequestException`, `NotFoundException`, unknown error → 500, validation details array |
| `date.util.spec.ts` | format/add/isExpired/diffInDays edge cases |
| `uuid.util.spec.ts` | Generated UUID matches v4 pattern, isValid true/false |
| `hash.util.spec.ts` | hash → verify round-trip, wrong password → false |
| `string.util.spec.ts` | slug, truncate boundary, maskEmail format |
| `array.util.spec.ts` | chunk with remainder, dedupe by key, groupBy result shape |
| `retry.util.spec.ts` | Succeeds on 2nd try, throws after max attempts, exponential delay |
| `pagination.dto.spec.ts` | Default values, max limit clamping |

Existing controller unit tests are unaffected — interceptor/filter are global and not loaded in unit test modules. Integration-level envelope verification is out of scope for Phase 8.

---

## 11. Acceptance Checklist

- [ ] All HTTP responses wrapped in `{ success, data, timestamp }`
- [ ] All HTTP errors wrapped in `{ success: false, error: { statusCode, message, details? }, timestamp }`
- [ ] `@SkipTransform()` on WS gateways — no double-wrapping
- [ ] `OffsetPaginationQuery` and `CursorPaginationQuery` DTOs with defaults
- [ ] `paginateOffset` and `paginateCursor` helpers
- [ ] 8 utility modules with full test coverage
- [ ] 4 custom validation decorators
- [ ] 3 Swagger response decorators
- [ ] Existing controllers updated to use new Swagger decorators
- [ ] `bun test` passes — all new tests green
- [ ] `bun run check` passes — no Biome errors
