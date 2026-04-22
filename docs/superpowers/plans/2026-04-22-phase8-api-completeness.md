# Phase 8: API Completeness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a consistent response envelope, global exception filter, pagination helpers, shared utilities, validation decorators, and Swagger integration so every HTTP endpoint is production-ready.

**Architecture:** `TransformInterceptor` wraps all HTTP responses in `{ success, data, timestamp }` unless the handler is decorated with `@SkipTransform()`. `HttpExceptionFilter` normalises all errors to `{ success: false, error: { statusCode, message, details? }, timestamp }`. Utility modules are pure named-export functions with no NestJS DI. Both the interceptor and filter already exist in the codebase but use a different shape — this plan updates them to the spec shape.

**Tech Stack:** NestJS interceptors/filters, class-validator decorators, argon2 (already installed), Swagger `@nestjs/swagger`

---

## File Map

### Updated
- `src/shared/presentation/dto/api-response.dto.ts` — new shape (timestamp, statusCode, details[], pagination types)
- `src/shared/presentation/filters/http-exception.filter.ts` — statusCode + timestamp + details[]
- `src/shared/presentation/filters/http-exception.filter.spec.ts` — updated tests for new shape
- `src/shared/presentation/interceptors/transform.interceptor.ts` — timestamp, SkipTransform, double-wrap guard
- `src/shared/presentation/interceptors/transform.interceptor.spec.ts` — updated tests
- `src/bootstrap/swagger/swagger.setup.ts` — global 400/401/403/404/500 schemas
- `src/modules/auth/auth.controller.ts` — `@ApiWrappedResponse` decorators
- `src/modules/users/users.controller.ts` — `@ApiWrappedResponse` decorators
- `src/modules/users/roles.controller.ts` — `@ApiWrappedResponse` decorators
- `src/modules/files/files.controller.ts` — `@ApiWrappedResponse` decorators
- `src/shared/infrastructure/gateway/app.gateway.ts` — `@SkipTransform()` on class
- `src/modules/chat/chat.gateway.ts` — `@SkipTransform()` on class

### Created
- `src/shared/presentation/decorators/skip-transform.decorator.ts`
- `src/shared/dto/pagination.dto.ts`
- `src/shared/dto/paginated-response.dto.ts`
- `src/shared/utils/pagination.util.ts` + `.spec.ts`
- `src/shared/utils/date.util.ts` + `.spec.ts`
- `src/shared/utils/uuid.util.ts` + `.spec.ts`
- `src/shared/utils/env.util.ts` + `.spec.ts`
- `src/shared/utils/hash.util.ts` + `.spec.ts`
- `src/shared/utils/string.util.ts` + `.spec.ts`
- `src/shared/utils/file.util.ts` + `.spec.ts`
- `src/shared/utils/array.util.ts` + `.spec.ts`
- `src/shared/utils/retry.util.ts` + `.spec.ts`
- `src/shared/decorators/validation/is-uuid.decorator.ts`
- `src/shared/decorators/validation/is-slug.decorator.ts`
- `src/shared/decorators/validation/is-past-date.decorator.ts`
- `src/shared/decorators/validation/is-strong-password.decorator.ts`
- `src/bootstrap/swagger/swagger-response.decorator.ts`

---

## Task 1: Update response DTOs

**Files:**
- Modify: `src/shared/presentation/dto/api-response.dto.ts`
- Create: `src/shared/dto/pagination.dto.ts`
- Create: `src/shared/dto/paginated-response.dto.ts`

- [ ] **Step 1: Update api-response.dto.ts to new spec shape**

Replace the entire file:

```typescript
// src/shared/presentation/dto/api-response.dto.ts
export interface ApiResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    statusCode: number;
    message: string | string[];
    details?: string[];
  };
  timestamp: string;
}
```

- [ ] **Step 2: Create src/shared/dto/ directory and pagination.dto.ts**

```typescript
// src/shared/dto/pagination.dto.ts
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class OffsetPaginationQuery {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}

export class CursorPaginationQuery {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
```

- [ ] **Step 3: Create paginated-response.dto.ts**

```typescript
// src/shared/dto/paginated-response.dto.ts
export interface OffsetMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CursorMeta {
  nextCursor: string | null;
  hasMore: boolean;
}

export interface OffsetPaginatedResponse<T> {
  success: true;
  data: T[];
  meta: OffsetMeta;
  timestamp: string;
}

export interface CursorPaginatedResponse<T> {
  success: true;
  data: T[];
  meta: CursorMeta;
  timestamp: string;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/shared/presentation/dto/api-response.dto.ts \
        src/shared/dto/pagination.dto.ts \
        src/shared/dto/paginated-response.dto.ts
git commit -m "feat: update ApiResponse DTOs to timestamped spec shape with pagination types"
```

---

## Task 2: @SkipTransform decorator + updated TransformInterceptor

**Files:**
- Create: `src/shared/presentation/decorators/skip-transform.decorator.ts`
- Modify: `src/shared/presentation/interceptors/transform.interceptor.ts`
- Modify: `src/shared/presentation/interceptors/transform.interceptor.spec.ts`

- [ ] **Step 1: Write the failing tests (update transform.interceptor.spec.ts)**

Replace the entire spec file to match the new shape with timestamp and SkipTransform:

```typescript
// src/shared/presentation/interceptors/transform.interceptor.spec.ts
import type { ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { TransformInterceptor } from './transform.interceptor';
import { SKIP_TRANSFORM_KEY } from '../decorators/skip-transform.decorator';

const makeContext = (skipHandler = false, skipClass = false): ExecutionContext =>
  ({
    getHandler: () => {
      const fn = () => {};
      if (skipHandler) Reflect.defineMetadata(SKIP_TRANSFORM_KEY, true, fn);
      return fn;
    },
    getClass: () => {
      const cls = class {};
      if (skipClass) Reflect.defineMetadata(SKIP_TRANSFORM_KEY, true, cls);
      return cls;
    },
  }) as unknown as ExecutionContext;

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<unknown>;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
  });

  it('wraps plain data in success envelope with timestamp', (done) => {
    const next = { handle: () => of({ id: 1 }) };
    interceptor.intercept(makeContext(), next).subscribe((result: unknown) => {
      const r = result as Record<string, unknown>;
      expect(r.success).toBe(true);
      expect(r.data).toEqual({ id: 1 });
      expect(typeof r.timestamp).toBe('string');
      done();
    });
  });

  it('wraps null in success envelope', (done) => {
    const next = { handle: () => of(null) };
    interceptor.intercept(makeContext(), next).subscribe((result: unknown) => {
      const r = result as Record<string, unknown>;
      expect(r.success).toBe(true);
      expect(r.data).toBeNull();
      done();
    });
  });

  it('skips wrapping when handler has @SkipTransform()', (done) => {
    const raw = { id: 1 };
    const next = { handle: () => of(raw) };
    interceptor
      .intercept(makeContext(true, false), next)
      .subscribe((result: unknown) => {
        expect(result).toBe(raw);
        done();
      });
  });

  it('skips wrapping when class has @SkipTransform()', (done) => {
    const raw = { id: 1 };
    const next = { handle: () => of(raw) };
    interceptor
      .intercept(makeContext(false, true), next)
      .subscribe((result: unknown) => {
        expect(result).toBe(raw);
        done();
      });
  });

  it('does not double-wrap already-enveloped response', (done) => {
    const alreadyWrapped = { success: true, data: { id: 2 }, timestamp: 'x' };
    const next = { handle: () => of(alreadyWrapped) };
    interceptor.intercept(makeContext(), next).subscribe((result: unknown) => {
      expect(result).toBe(alreadyWrapped);
      done();
    });
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
bun test src/shared/presentation/interceptors/transform.interceptor.spec.ts
```

Expected: failures because TransformInterceptor doesn't match new shape yet.

- [ ] **Step 3: Create skip-transform.decorator.ts**

```typescript
// src/shared/presentation/decorators/skip-transform.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const SKIP_TRANSFORM_KEY = 'skipTransform';
export const SkipTransform = () => SetMetadata(SKIP_TRANSFORM_KEY, true);
```

- [ ] **Step 4: Update transform.interceptor.ts**

```typescript
// src/shared/presentation/interceptors/transform.interceptor.ts
import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ApiResponse } from '../dto/api-response.dto';
import { SKIP_TRANSFORM_KEY } from '../decorators/skip-transform.decorator';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T> | T>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T> | T> {
    const skipHandler = Reflect.getMetadata(
      SKIP_TRANSFORM_KEY,
      context.getHandler(),
    ) as boolean | undefined;
    const skipClass = Reflect.getMetadata(
      SKIP_TRANSFORM_KEY,
      context.getClass(),
    ) as boolean | undefined;

    if (skipHandler || skipClass) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        if (
          data !== null &&
          typeof data === 'object' &&
          'success' in (data as object)
        ) {
          return data as ApiResponse<T>;
        }
        return {
          success: true as const,
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
bun test src/shared/presentation/interceptors/transform.interceptor.spec.ts
```

Expected: all 5 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/shared/presentation/decorators/skip-transform.decorator.ts \
        src/shared/presentation/interceptors/transform.interceptor.ts \
        src/shared/presentation/interceptors/transform.interceptor.spec.ts
git commit -m "feat: add @SkipTransform decorator and update TransformInterceptor with timestamp and double-wrap guard"
```

---

## Task 3: Updated HttpExceptionFilter

**Files:**
- Modify: `src/shared/presentation/filters/http-exception.filter.ts`
- Modify: `src/shared/presentation/filters/http-exception.filter.spec.ts`

- [ ] **Step 1: Write the failing tests (update http-exception.filter.spec.ts)**

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

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => ({ status: mockStatus }),
        getRequest: () => ({}),
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
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
bun test src/shared/presentation/filters/http-exception.filter.spec.ts
```

Expected: failures because current filter returns `code` format, not `statusCode`.

- [ ] **Step 3: Update http-exception.filter.ts**

```typescript
// src/shared/presentation/filters/http-exception.filter.ts
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

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

- [ ] **Step 4: Run tests to confirm they pass**

```bash
bun test src/shared/presentation/filters/http-exception.filter.spec.ts
```

Expected: all 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/shared/presentation/filters/http-exception.filter.ts \
        src/shared/presentation/filters/http-exception.filter.spec.ts
git commit -m "feat: update HttpExceptionFilter to statusCode/timestamp/details[] spec shape"
```

---

## Task 4: Pagination utilities + @SkipTransform on gateways

**Files:**
- Create: `src/shared/utils/pagination.util.ts`
- Create: `src/shared/utils/pagination.util.spec.ts`
- Modify: `src/shared/infrastructure/gateway/app.gateway.ts`
- Modify: `src/modules/chat/chat.gateway.ts`

- [ ] **Step 1: Write failing tests for pagination helpers**

```typescript
// src/shared/utils/pagination.util.spec.ts
import { paginateCursor, paginateOffset } from './pagination.util';
import type { CursorPaginationQuery, OffsetPaginationQuery } from '../dto/pagination.dto';

describe('paginateOffset', () => {
  const query: OffsetPaginationQuery = Object.assign(
    new (class {})(),
    { page: 2, limit: 10 },
  ) as OffsetPaginationQuery;

  it('returns success envelope with offset meta', () => {
    const result = paginateOffset(['a', 'b'], 25, query);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(['a', 'b']);
    expect(result.meta.total).toBe(25);
    expect(result.meta.page).toBe(2);
    expect(result.meta.limit).toBe(10);
    expect(result.meta.totalPages).toBe(3);
    expect(typeof result.timestamp).toBe('string');
  });

  it('calculates totalPages correctly when exactly divisible', () => {
    const q = Object.assign(new (class {})(), { page: 1, limit: 5 }) as OffsetPaginationQuery;
    expect(paginateOffset([], 10, q).meta.totalPages).toBe(2);
  });

  it('calculates totalPages = 0 when total is 0', () => {
    const q = Object.assign(new (class {})(), { page: 1, limit: 20 }) as OffsetPaginationQuery;
    expect(paginateOffset([], 0, q).meta.totalPages).toBe(0);
  });
});

describe('paginateCursor', () => {
  const query: CursorPaginationQuery = Object.assign(
    new (class {})(),
    { limit: 20 },
  ) as CursorPaginationQuery;

  it('returns success envelope with cursor meta', () => {
    const result = paginateCursor(['a'], 'cursor123', query);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(['a']);
    expect(result.meta.nextCursor).toBe('cursor123');
    expect(result.meta.hasMore).toBe(true);
    expect(typeof result.timestamp).toBe('string');
  });

  it('sets hasMore false when nextCursor is null', () => {
    const result = paginateCursor([], null, query);
    expect(result.meta.nextCursor).toBeNull();
    expect(result.meta.hasMore).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
bun test src/shared/utils/pagination.util.spec.ts
```

Expected: FAIL — pagination.util.ts does not exist yet.

- [ ] **Step 3: Create pagination.util.ts**

```typescript
// src/shared/utils/pagination.util.ts
import type { CursorPaginationQuery, OffsetPaginationQuery } from '../dto/pagination.dto';
import type {
  CursorPaginatedResponse,
  OffsetPaginatedResponse,
} from '../dto/paginated-response.dto';

export function paginateOffset<T>(
  data: T[],
  total: number,
  query: OffsetPaginationQuery,
): OffsetPaginatedResponse<T> {
  const totalPages = total === 0 ? 0 : Math.ceil(total / query.limit);
  return {
    success: true,
    data,
    meta: { total, page: query.page, limit: query.limit, totalPages },
    timestamp: new Date().toISOString(),
  };
}

export function paginateCursor<T>(
  data: T[],
  nextCursor: string | null,
  _query: CursorPaginationQuery,
): CursorPaginatedResponse<T> {
  return {
    success: true,
    data,
    meta: { nextCursor, hasMore: nextCursor !== null },
    timestamp: new Date().toISOString(),
  };
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
bun test src/shared/utils/pagination.util.spec.ts
```

Expected: all 5 tests pass.

- [ ] **Step 5: Add @SkipTransform() to AppGateway class**

Add `SkipTransform` import and decorator to `src/shared/infrastructure/gateway/app.gateway.ts`:

Find the class declaration:
```typescript
@WebSocketGateway({ cors: { origin: '*' } })
export class AppGateway
```

Replace with:
```typescript
import { SkipTransform } from '../../presentation/decorators/skip-transform.decorator';

@SkipTransform()
@WebSocketGateway({ cors: { origin: '*' } })
export class AppGateway
```

(Add the import at the top of the file alongside other imports.)

- [ ] **Step 6: Add @SkipTransform() to ChatGateway class**

Add `SkipTransform` import and decorator to `src/modules/chat/chat.gateway.ts`:

Find:
```typescript
@WebSocketGateway({ namespace: 'chat', cors: { origin: '*' } })
export class ChatGateway
```

Replace with:
```typescript
import { SkipTransform } from '../../shared/presentation/decorators/skip-transform.decorator';

@SkipTransform()
@WebSocketGateway({ namespace: 'chat', cors: { origin: '*' } })
export class ChatGateway
```

- [ ] **Step 7: Commit**

```bash
git add src/shared/utils/pagination.util.ts \
        src/shared/utils/pagination.util.spec.ts \
        src/shared/infrastructure/gateway/app.gateway.ts \
        src/modules/chat/chat.gateway.ts
git commit -m "feat: add pagination helpers and apply @SkipTransform to WebSocket gateways"
```

---

## Task 5: date.util

**Files:**
- Create: `src/shared/utils/date.util.ts`
- Create: `src/shared/utils/date.util.spec.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/shared/utils/date.util.spec.ts
import {
  addDays,
  diffInDays,
  formatDate,
  isExpired,
  subtractDays,
  toISOString,
} from './date.util';

describe('date.util', () => {
  const base = new Date('2026-04-22T12:00:00.000Z');

  describe('formatDate', () => {
    it('formats YYYY-MM-DD', () => {
      expect(formatDate(base, 'YYYY-MM-DD')).toBe('2026-04-22');
    });

    it('formats DD/MM/YYYY', () => {
      expect(formatDate(base, 'DD/MM/YYYY')).toBe('22/04/2026');
    });

    it('formats HH:mm:ss', () => {
      const d = new Date('2026-04-22T09:05:03.000Z');
      expect(formatDate(d, 'HH:mm:ss')).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });
  });

  describe('addDays', () => {
    it('adds days', () => {
      const result = addDays(base, 3);
      expect(result.getUTCDate()).toBe(25);
    });
  });

  describe('subtractDays', () => {
    it('subtracts days', () => {
      const result = subtractDays(base, 2);
      expect(result.getUTCDate()).toBe(20);
    });
  });

  describe('isExpired', () => {
    it('returns true for past date', () => {
      expect(isExpired(new Date('2020-01-01'))).toBe(true);
    });

    it('returns false for future date', () => {
      expect(isExpired(new Date('2099-01-01'))).toBe(false);
    });
  });

  describe('diffInDays', () => {
    it('calculates day difference', () => {
      const a = new Date('2026-04-22');
      const b = new Date('2026-04-25');
      expect(diffInDays(a, b)).toBe(-3);
    });
  });

  describe('toISOString', () => {
    it('returns ISO string', () => {
      expect(toISOString(base)).toBe('2026-04-22T12:00:00.000Z');
    });
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
bun test src/shared/utils/date.util.spec.ts
```

- [ ] **Step 3: Create date.util.ts**

```typescript
// src/shared/utils/date.util.ts
const pad = (n: number): string => String(n).padStart(2, '0');

export function formatDate(date: Date, format: string): string {
  return format
    .replace('YYYY', String(date.getUTCFullYear()))
    .replace('MM', pad(date.getUTCMonth() + 1))
    .replace('DD', pad(date.getUTCDate()))
    .replace('HH', pad(date.getUTCHours()))
    .replace('mm', pad(date.getUTCMinutes()))
    .replace('ss', pad(date.getUTCSeconds()));
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function subtractDays(date: Date, days: number): Date {
  return addDays(date, -days);
}

export function isExpired(date: Date): boolean {
  return date < new Date();
}

export function diffInDays(a: Date, b: Date): number {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.trunc((a.getTime() - b.getTime()) / MS_PER_DAY);
}

export function toISOString(date: Date): string {
  return date.toISOString();
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
bun test src/shared/utils/date.util.spec.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/shared/utils/date.util.ts src/shared/utils/date.util.spec.ts
git commit -m "feat: add date.util with format/add/subtract/isExpired/diffInDays"
```

---

## Task 6: uuid.util

**Files:**
- Create: `src/shared/utils/uuid.util.ts`
- Create: `src/shared/utils/uuid.util.spec.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/shared/utils/uuid.util.spec.ts
import { generateUuid, isValidUuid } from './uuid.util';

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('uuid.util', () => {
  describe('generateUuid', () => {
    it('generates a UUID v4 string', () => {
      const uuid = generateUuid();
      expect(UUID_V4_PATTERN.test(uuid)).toBe(true);
    });

    it('generates unique values', () => {
      expect(generateUuid()).not.toBe(generateUuid());
    });
  });

  describe('isValidUuid', () => {
    it('returns true for valid UUID v4', () => {
      expect(isValidUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('returns false for invalid string', () => {
      expect(isValidUuid('not-a-uuid')).toBe(false);
      expect(isValidUuid('')).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
bun test src/shared/utils/uuid.util.spec.ts
```

- [ ] **Step 3: Create uuid.util.ts**

```typescript
// src/shared/utils/uuid.util.ts
import { randomUUID } from 'node:crypto';

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function generateUuid(): string {
  return randomUUID();
}

export function isValidUuid(str: string): boolean {
  return UUID_V4_PATTERN.test(str);
}
```

- [ ] **Step 4: Run tests and commit**

```bash
bun test src/shared/utils/uuid.util.spec.ts
git add src/shared/utils/uuid.util.ts src/shared/utils/uuid.util.spec.ts
git commit -m "feat: add uuid.util with generateUuid and isValidUuid"
```

---

## Task 7: env.util

**Files:**
- Create: `src/shared/utils/env.util.ts`
- Create: `src/shared/utils/env.util.spec.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/shared/utils/env.util.spec.ts
import { getEnvOrDefault, requireEnv } from './env.util';

describe('env.util', () => {
  const ORIGINAL = process.env['TEST_KEY'];

  afterEach(() => {
    if (ORIGINAL === undefined) {
      delete process.env['TEST_KEY'];
    } else {
      process.env['TEST_KEY'] = ORIGINAL;
    }
  });

  describe('requireEnv', () => {
    it('returns the env value when present', () => {
      process.env['TEST_KEY'] = 'hello';
      expect(requireEnv('TEST_KEY')).toBe('hello');
    });

    it('throws when the key is missing', () => {
      delete process.env['TEST_KEY'];
      expect(() => requireEnv('TEST_KEY')).toThrow(
        'Required environment variable TEST_KEY is not set',
      );
    });
  });

  describe('getEnvOrDefault', () => {
    it('returns the env value when present', () => {
      process.env['TEST_KEY'] = 'value';
      expect(getEnvOrDefault('TEST_KEY', 'fallback')).toBe('value');
    });

    it('returns fallback when key is missing', () => {
      delete process.env['TEST_KEY'];
      expect(getEnvOrDefault('TEST_KEY', 'fallback')).toBe('fallback');
    });
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
bun test src/shared/utils/env.util.spec.ts
```

- [ ] **Step 3: Create env.util.ts**

```typescript
// src/shared/utils/env.util.ts
export function requireEnv(key: string): string {
  const value = process.env[key];
  if (value === undefined || value === '') {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

export function getEnvOrDefault(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}
```

- [ ] **Step 4: Run tests and commit**

```bash
bun test src/shared/utils/env.util.spec.ts
git add src/shared/utils/env.util.ts src/shared/utils/env.util.spec.ts
git commit -m "feat: add env.util with requireEnv and getEnvOrDefault"
```

---

## Task 8: hash.util

**Files:**
- Create: `src/shared/utils/hash.util.ts`
- Create: `src/shared/utils/hash.util.spec.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/shared/utils/hash.util.spec.ts
import { hashPassword, verifyPassword } from './hash.util';

describe('hash.util', () => {
  it('hashPassword returns a non-empty string different from input', async () => {
    const hash = await hashPassword('secret123');
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
    expect(hash).not.toBe('secret123');
  });

  it('verifyPassword returns true for correct password', async () => {
    const hash = await hashPassword('myPassword!');
    expect(await verifyPassword('myPassword!', hash)).toBe(true);
  });

  it('verifyPassword returns false for wrong password', async () => {
    const hash = await hashPassword('correct');
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
bun test src/shared/utils/hash.util.spec.ts
```

- [ ] **Step 3: Create hash.util.ts**

```typescript
// src/shared/utils/hash.util.ts
import * as argon2 from 'argon2';

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return argon2.verify(hash, plain);
}
```

- [ ] **Step 4: Run tests and commit**

```bash
bun test src/shared/utils/hash.util.spec.ts
git add src/shared/utils/hash.util.ts src/shared/utils/hash.util.spec.ts
git commit -m "feat: add hash.util with hashPassword/verifyPassword (argon2)"
```

---

## Task 9: string.util

**Files:**
- Create: `src/shared/utils/string.util.ts`
- Create: `src/shared/utils/string.util.spec.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/shared/utils/string.util.spec.ts
import {
  camelToSnake,
  capitalize,
  maskEmail,
  snakeToCamel,
  toSlug,
  truncate,
} from './string.util';

describe('string.util', () => {
  describe('toSlug', () => {
    it('converts spaces to hyphens and lowercases', () => {
      expect(toSlug('Hello World')).toBe('hello-world');
    });

    it('removes special characters', () => {
      expect(toSlug('Héllo! World?')).toBe('hllo-world');
    });

    it('collapses multiple hyphens', () => {
      expect(toSlug('hello   world')).toBe('hello-world');
    });
  });

  describe('truncate', () => {
    it('returns unchanged when within limit', () => {
      expect(truncate('hello', 10)).toBe('hello');
    });

    it('adds ellipsis when over limit', () => {
      expect(truncate('hello world', 8)).toBe('hello...');
    });

    it('handles exact boundary', () => {
      expect(truncate('hello', 5)).toBe('hello');
    });
  });

  describe('maskEmail', () => {
    it('masks local part after first character', () => {
      expect(maskEmail('john@example.com')).toBe('j***@example.com');
    });

    it('handles single-char local part', () => {
      expect(maskEmail('a@b.com')).toBe('a***@b.com');
    });
  });

  describe('capitalize', () => {
    it('capitalizes first letter', () => {
      expect(capitalize('hello world')).toBe('Hello world');
    });

    it('handles empty string', () => {
      expect(capitalize('')).toBe('');
    });
  });

  describe('camelToSnake', () => {
    it('converts camelCase to snake_case', () => {
      expect(camelToSnake('helloWorld')).toBe('hello_world');
      expect(camelToSnake('camelCaseString')).toBe('camel_case_string');
    });
  });

  describe('snakeToCamel', () => {
    it('converts snake_case to camelCase', () => {
      expect(snakeToCamel('hello_world')).toBe('helloWorld');
      expect(snakeToCamel('snake_case_string')).toBe('snakeCaseString');
    });
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
bun test src/shared/utils/string.util.spec.ts
```

- [ ] **Step 3: Create string.util.ts**

```typescript
// src/shared/utils/string.util.ts
export function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-');
}

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 3) + '...';
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  return `${(local ?? '').charAt(0)}***@${domain ?? ''}`;
}

export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function camelToSnake(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}
```

- [ ] **Step 4: Run tests and commit**

```bash
bun test src/shared/utils/string.util.spec.ts
git add src/shared/utils/string.util.ts src/shared/utils/string.util.spec.ts
git commit -m "feat: add string.util with toSlug/truncate/maskEmail/capitalize/camelToSnake/snakeToCamel"
```

---

## Task 10: file.util

**Files:**
- Create: `src/shared/utils/file.util.ts`
- Create: `src/shared/utils/file.util.spec.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/shared/utils/file.util.spec.ts
import {
  formatFileSize,
  getExtension,
  getMimeType,
  isImageFile,
} from './file.util';

describe('file.util', () => {
  describe('getMimeType', () => {
    it('returns correct mime for .jpg', () => {
      expect(getMimeType('photo.jpg')).toBe('image/jpeg');
    });

    it('returns correct mime for .png', () => {
      expect(getMimeType('icon.PNG')).toBe('image/png');
    });

    it('returns application/octet-stream for unknown extension', () => {
      expect(getMimeType('file.xyz')).toBe('application/octet-stream');
    });
  });

  describe('getExtension', () => {
    it('returns extension including dot', () => {
      expect(getExtension('file.txt')).toBe('.txt');
    });

    it('returns empty string when no extension', () => {
      expect(getExtension('README')).toBe('');
    });
  });

  describe('formatFileSize', () => {
    it('formats bytes', () => {
      expect(formatFileSize(512)).toBe('512 B');
    });

    it('formats kilobytes', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('formats megabytes', () => {
      expect(formatFileSize(1572864)).toBe('1.5 MB');
    });
  });

  describe('isImageFile', () => {
    it('returns true for image files', () => {
      expect(isImageFile('photo.jpg')).toBe(true);
      expect(isImageFile('icon.PNG')).toBe(true);
      expect(isImageFile('img.webp')).toBe(true);
    });

    it('returns false for non-image files', () => {
      expect(isImageFile('document.pdf')).toBe(false);
      expect(isImageFile('archive.zip')).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
bun test src/shared/utils/file.util.spec.ts
```

- [ ] **Step 3: Create file.util.ts**

```typescript
// src/shared/utils/file.util.ts
import { extname } from 'node:path';

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
  '.html': 'text/html',
  '.htm': 'text/html',
  '.json': 'application/json',
  '.zip': 'application/zip',
  '.csv': 'text/csv',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
};

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']);

export function getMimeType(filename: string): string {
  const ext = extname(filename).toLowerCase();
  return MIME_MAP[ext] ?? 'application/octet-stream';
}

export function getExtension(filename: string): string {
  return extname(filename);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isImageFile(filename: string): boolean {
  return IMAGE_EXTS.has(extname(filename).toLowerCase());
}
```

- [ ] **Step 4: Run tests and commit**

```bash
bun test src/shared/utils/file.util.spec.ts
git add src/shared/utils/file.util.ts src/shared/utils/file.util.spec.ts
git commit -m "feat: add file.util with getMimeType/getExtension/formatFileSize/isImageFile"
```

---

## Task 11: array.util

**Files:**
- Create: `src/shared/utils/array.util.ts`
- Create: `src/shared/utils/array.util.spec.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/shared/utils/array.util.spec.ts
import { chunk, dedupe, flatten, groupBy } from './array.util';

describe('array.util', () => {
  describe('chunk', () => {
    it('splits array into chunks of given size', () => {
      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('returns one chunk when size >= length', () => {
      expect(chunk([1, 2], 5)).toEqual([[1, 2]]);
    });

    it('returns empty array for empty input', () => {
      expect(chunk([], 3)).toEqual([]);
    });
  });

  describe('dedupe', () => {
    it('removes primitives duplicates', () => {
      expect(dedupe([1, 2, 2, 3, 1])).toEqual([1, 2, 3]);
    });

    it('dedupes objects by key', () => {
      const items = [
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
        { id: 1, name: 'c' },
      ];
      expect(dedupe(items, 'id')).toEqual([
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
      ]);
    });
  });

  describe('groupBy', () => {
    it('groups objects by key', () => {
      const items = [
        { type: 'a', val: 1 },
        { type: 'b', val: 2 },
        { type: 'a', val: 3 },
      ];
      const result = groupBy(items, 'type');
      expect(result['a']).toHaveLength(2);
      expect(result['b']).toHaveLength(1);
    });
  });

  describe('flatten', () => {
    it('flattens nested array one level', () => {
      expect(flatten([[1, 2], [3, 4], [5]])).toEqual([1, 2, 3, 4, 5]);
    });

    it('returns empty for empty input', () => {
      expect(flatten([])).toEqual([]);
    });
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
bun test src/shared/utils/array.util.spec.ts
```

- [ ] **Step 3: Create array.util.ts**

```typescript
// src/shared/utils/array.util.ts
export function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

export function dedupe<T>(arr: T[], key?: keyof T): T[] {
  if (!key) {
    return [...new Set(arr)];
  }
  const seen = new Set<unknown>();
  return arr.filter((item) => {
    const k = item[key];
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const k = String(item[key]);
    (acc[k] ??= []).push(item);
    return acc;
  }, {});
}

export function flatten<T>(arr: T[][]): T[] {
  return ([] as T[]).concat(...arr);
}
```

- [ ] **Step 4: Run tests and commit**

```bash
bun test src/shared/utils/array.util.spec.ts
git add src/shared/utils/array.util.ts src/shared/utils/array.util.spec.ts
git commit -m "feat: add array.util with chunk/dedupe/groupBy/flatten"
```

---

## Task 12: retry.util

**Files:**
- Create: `src/shared/utils/retry.util.ts`
- Create: `src/shared/utils/retry.util.spec.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/shared/utils/retry.util.spec.ts
import { retry } from './retry.util';

describe('retry.util', () => {
  it('resolves immediately on first success', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    await expect(retry(fn, { attempts: 3, delayMs: 0, backoff: 'linear' })).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries and succeeds on second attempt', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');
    await expect(retry(fn, { attempts: 3, delayMs: 0, backoff: 'linear' })).resolves.toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws after max attempts', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('always fails'));
    await expect(retry(fn, { attempts: 3, delayMs: 0, backoff: 'linear' })).rejects.toThrow(
      'always fails',
    );
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('uses default options when none provided', async () => {
    const fn = jest.fn().mockResolvedValue('default');
    await expect(retry(fn)).resolves.toBe('default');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
bun test src/shared/utils/retry.util.spec.ts
```

- [ ] **Step 3: Create retry.util.ts**

```typescript
// src/shared/utils/retry.util.ts
export interface RetryOptions {
  attempts: number;
  delayMs: number;
  backoff: 'linear' | 'exponential';
}

const DEFAULT_OPTIONS: RetryOptions = {
  attempts: 3,
  delayMs: 500,
  backoff: 'exponential',
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retry<T>(
  fn: () => Promise<T>,
  options?: Partial<RetryOptions>,
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < opts.attempts) {
        const delay =
          opts.backoff === 'exponential'
            ? opts.delayMs * 2 ** (attempt - 1)
            : opts.delayMs * attempt;
        await sleep(delay);
      }
    }
  }

  throw lastError;
}
```

- [ ] **Step 4: Run tests and commit**

```bash
bun test src/shared/utils/retry.util.spec.ts
git add src/shared/utils/retry.util.ts src/shared/utils/retry.util.spec.ts
git commit -m "feat: add retry.util with linear and exponential backoff"
```

---

## Task 13: Validation decorators

**Files:**
- Create: `src/shared/decorators/validation/is-uuid.decorator.ts`
- Create: `src/shared/decorators/validation/is-slug.decorator.ts`
- Create: `src/shared/decorators/validation/is-past-date.decorator.ts`
- Create: `src/shared/decorators/validation/is-strong-password.decorator.ts`

All decorators wrap `registerDecorator` from `class-validator`. No spec files required by the spec, but each decorator is small and verifiable by running the full suite.

- [ ] **Step 1: Create is-uuid.decorator.ts**

```typescript
// src/shared/decorators/validation/is-uuid.decorator.ts
import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function IsUuid(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isUuid',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate(value: unknown, _args: ValidationArguments) {
          return typeof value === 'string' && UUID_V4_PATTERN.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid UUID v4`;
        },
      },
    });
  };
}
```

- [ ] **Step 2: Create is-slug.decorator.ts**

```typescript
// src/shared/decorators/validation/is-slug.decorator.ts
import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function IsSlug(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isSlug',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate(value: unknown, _args: ValidationArguments) {
          return typeof value === 'string' && SLUG_PATTERN.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid slug (lowercase letters, numbers, hyphens)`;
        },
      },
    });
  };
}
```

- [ ] **Step 3: Create is-past-date.decorator.ts**

```typescript
// src/shared/decorators/validation/is-past-date.decorator.ts
import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

export function IsPastDate(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPastDate',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate(value: unknown, _args: ValidationArguments) {
          return value instanceof Date && value < new Date();
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a date in the past`;
        },
      },
    });
  };
}
```

- [ ] **Step 4: Create is-strong-password.decorator.ts**

```typescript
// src/shared/decorators/validation/is-strong-password.decorator.ts
import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

export function IsStrongPassword(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate(value: unknown, _args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          return (
            value.length >= 8 &&
            /\d/.test(value) &&
            /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be at least 8 characters and contain at least 1 number and 1 special character`;
        },
      },
    });
  };
}
```

- [ ] **Step 5: Commit**

```bash
git add src/shared/decorators/validation/
git commit -m "feat: add custom validation decorators (IsUuid, IsSlug, IsPastDate, IsStrongPassword)"
```

---

## Task 14: Swagger response decorators + swagger.setup.ts

**Files:**
- Create: `src/bootstrap/swagger/swagger-response.decorator.ts`
- Modify: `src/bootstrap/swagger/swagger.setup.ts`

- [ ] **Step 1: Create swagger-response.decorator.ts**

```typescript
// src/bootstrap/swagger/swagger-response.decorator.ts
import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

export function ApiWrappedResponse<T>(model: Type<T>) {
  return applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      schema: {
        properties: {
          success: { type: 'boolean', example: true },
          data: { $ref: getSchemaPath(model) },
          timestamp: { type: 'string', example: '2026-04-22T10:00:00.000Z' },
        },
      },
    }),
  );
}

export function ApiOffsetPaginatedResponse<T>(model: Type<T>) {
  return applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      schema: {
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'array', items: { $ref: getSchemaPath(model) } },
          meta: {
            type: 'object',
            properties: {
              total: { type: 'number' },
              page: { type: 'number' },
              limit: { type: 'number' },
              totalPages: { type: 'number' },
            },
          },
          timestamp: { type: 'string', example: '2026-04-22T10:00:00.000Z' },
        },
      },
    }),
  );
}

export function ApiCursorPaginatedResponse<T>(model: Type<T>) {
  return applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      schema: {
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'array', items: { $ref: getSchemaPath(model) } },
          meta: {
            type: 'object',
            properties: {
              nextCursor: { type: 'string', nullable: true },
              hasMore: { type: 'boolean' },
            },
          },
          timestamp: { type: 'string', example: '2026-04-22T10:00:00.000Z' },
        },
      },
    }),
  );
}
```

- [ ] **Step 2: Update swagger.setup.ts with global error response schemas**

Replace the entire file:

```typescript
// src/bootstrap/swagger/swagger.setup.ts
import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const errorSchema = (statusCode: number, example: string) => ({
  properties: {
    success: { type: 'boolean', example: false },
    error: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: statusCode },
        message: { type: 'string', example },
        details: {
          type: 'array',
          items: { type: 'string' },
          nullable: true,
        },
      },
    },
    timestamp: { type: 'string', example: '2026-04-22T10:00:00.000Z' },
  },
});

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('NestJS Bootstrap API')
    .setDescription('DDD 기반 NestJS 백엔드 부트스트랩 API')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addGlobalParameters({
      in: 'header',
      required: false,
      name: 'X-API-Version',
      schema: { type: 'string', default: '1', example: '1' },
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Inject global error response schemas
  document.components ??= {};
  document.components.schemas ??= {};
  document.components.schemas['Error400'] = errorSchema(
    400,
    'Validation failed',
  );
  document.components.schemas['Error401'] = errorSchema(401, 'Unauthorized');
  document.components.schemas['Error403'] = errorSchema(403, 'Forbidden');
  document.components.schemas['Error404'] = errorSchema(404, 'Not Found');
  document.components.schemas['Error500'] = errorSchema(
    500,
    'Internal server error',
  );

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/bootstrap/swagger/swagger-response.decorator.ts \
        src/bootstrap/swagger/swagger.setup.ts
git commit -m "feat: add Swagger response decorators and global error schemas"
```

---

## Task 15: Update controllers with Swagger decorators

**Files:**
- Modify: `src/modules/auth/auth.controller.ts`
- Modify: `src/modules/users/users.controller.ts`
- Modify: `src/modules/users/roles.controller.ts`
- Modify: `src/modules/files/files.controller.ts`

- [ ] **Step 1: Update auth.controller.ts with Swagger decorators**

Add imports at the top:
```typescript
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiWrappedResponse } from '../../bootstrap/swagger/swagger-response.decorator';
```

Add `@ApiTags('auth')` to the class. Add `@ApiOperation` + `@ApiWrappedResponse` to each route. Since the auth endpoints return raw token objects (no DTO), use `@ApiOkResponse` with an inline schema for the token endpoints, and `@ApiWrappedResponse` for the `me` endpoint once a `UserDto` exists. For now, annotate with `@ApiOperation` summaries on all methods:

```typescript
// src/modules/auth/auth.controller.ts
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import type { ForgotPasswordDto } from './dto/forgot-password.dto';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import type { ResetPasswordDto } from './dto/reset-password.dto';
import type { SubscribeDto } from './dto/subscribe.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  login(
    @Body() dto: LoginDto,
    @CurrentUser() user: { userId: string; email: string },
    @Req() req: Request,
  ) {
    const ip = req.ip ?? 'unknown';
    const userAgent = req.headers['user-agent'] ?? 'unknown';
    return this.authService.login(dto, user, ip, userAgent);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and invalidate refresh tokens' })
  async logout(@CurrentUser('userId') userId: string) {
    await this.authService.logout(userId);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send password reset email' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email address with token' })
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current authenticated user' })
  me(@CurrentUser() user: { userId: string; email: string }) {
    return user;
  }

  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Subscribe to marketing emails' })
  subscribe(@Body() dto: SubscribeDto) {
    return this.authService.subscribeMarketing(dto.email);
  }

  @Get('subscribe/confirm')
  @ApiOperation({ summary: 'Confirm marketing subscription' })
  confirmSubscription(@Query('token') token: string) {
    return this.authService.confirmSubscription(token);
  }

  @Get('unsubscribe')
  @ApiOperation({ summary: 'Unsubscribe from marketing emails' })
  unsubscribe(@Query('token') token: string) {
    return this.authService.unsubscribeMarketing(token);
  }
}
```

- [ ] **Step 2: Update users.controller.ts — add ApiTags and ensure ApiOperation on all methods**

The `users.controller.ts` already has `@ApiTags('users')` and `@ApiOperation` on all methods. Verify and add `@ApiBearerAuth('access-token')` to the class:

```typescript
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
```

Add `@ApiBearerAuth('access-token')` to the class decorator and ensure all methods have `@ApiOperation`. No changes needed beyond that.

- [ ] **Step 3: Update roles.controller.ts — add ApiTags and ApiOperation**

```typescript
// Add to roles.controller.ts imports:
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';

// Add to class:
@ApiTags('roles')
@ApiBearerAuth('access-token')
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
```

Add `@ApiOperation({ summary: '...' })` to each method:
- `findAll` → `'List all roles'`
- `findOne` → `'Get role by id'`
- `create` → `'Create a new role'`
- `update` → `'Update role'`
- `remove` → `'Delete role'`
- `assignPermissions` → `'Set role permissions'`

- [ ] **Step 4: Update files.controller.ts — add ApiTags and ApiOperation**

Add to `files.controller.ts`:
```typescript
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
```

Add class decorators:
```typescript
@ApiTags('files')
@ApiBearerAuth('access-token')
```

Add `@ApiOperation` to each route method (`upload`, `findAll`, `findOne`, `deleteFile`).

- [ ] **Step 5: Run full linting to verify**

```bash
bun run check
```

Fix any Biome errors reported.

- [ ] **Step 6: Run full test suite**

```bash
bun test src/
```

Expected: all existing + new tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/modules/auth/auth.controller.ts \
        src/modules/users/users.controller.ts \
        src/modules/users/roles.controller.ts \
        src/modules/files/files.controller.ts
git commit -m "feat: add ApiTags/ApiOperation/ApiBearerAuth Swagger decorators to all controllers"
```

---

## Acceptance Verification

After all tasks are complete, run the final checks:

- [ ] **Run full test suite**

```bash
bun test src/
```

Expected: all new tests green, zero failures.

- [ ] **Run linting**

```bash
bun run check
```

Expected: zero Biome errors.

- [ ] **Verify response envelope manually** (start server, hit an endpoint):

```bash
curl -s http://localhost:3000/auth/me -H 'Authorization: Bearer invalid' | jq .
```

Expected output shape:
```json
{
  "success": false,
  "error": { "statusCode": 401, "message": "Unauthorized" },
  "timestamp": "2026-04-22T..."
}
```

- [ ] **Final commit tag**

```bash
git commit --allow-empty -m "chore: Phase 8 complete — API completeness layer"
```

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 0 | — | — |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | NO_UI_SCOPE | no UI scope — backend only |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

**VERDICT:** Design Review confirmed no UI scope. Eng Review required before implementation.
