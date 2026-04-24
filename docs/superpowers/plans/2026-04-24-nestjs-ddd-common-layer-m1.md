# NestJS DDD Common Layer M1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the M1 DDD common layer: shared boundaries, standard response/error envelopes, trace id propagation, request logging, pagination helpers, security bootstrap, and a DDD-style health use case.

**Architecture:** Shared primitives are split by DDD layer under `src/shared`. Global HTTP behavior is installed from bootstrap setup functions in `src/main.ts` and mirrored in e2e tests. Domain and application errors stay framework-independent; presentation filters and interceptors translate them into HTTP envelopes.

**Tech Stack:** Bun, NestJS 11, TypeScript, Jest, Supertest, Biome, Helmet, `@nestjs/throttler`.

---

## Scope Boundary

This plan implements only M1 from the approved spec:

- Spec: `docs/superpowers/specs/2026-04-24-nestjs-ddd-common-layer-design.md`
- Prior milestone: M0 foundation already exists.

This plan does not implement database access, users CRUD, auth, JWT, RBAC, OAuth, Docker, or migrations.

## File Structure

Create or modify these files:

- Modify: `package.json` - add security dependencies.
- Modify: `bun.lock` - update lockfile after dependency install.
- Modify: `.env.example` - document security env variables.
- Modify: `.env.development` - add development security defaults.
- Modify: `.env.test` - add test security defaults.
- Modify: `src/bootstrap/config/app-config.ts` - validate and expose security config.
- Create: `src/bootstrap/security/setup-security.ts` - enable Helmet and CORS.
- Create: `src/bootstrap/http/setup-http-pipeline.ts` - register trace middleware, request logging, interceptor, and filter in one reusable setup function.
- Modify: `src/main.ts` - call security and HTTP pipeline setup.
- Modify: `src/app.module.ts` - import throttling module and refactored health module.
- Create: `src/shared/domain/errors/domain-error.ts` - base domain error and category type.
- Create: `src/shared/application/errors/application-error.ts` - base application error and category type.
- Create: `src/shared/application/pagination/pagination.ts` - pagination contracts and helpers.
- Test: `src/shared/application/pagination/pagination.spec.ts` - pagination unit tests.
- Create: `src/shared/infrastructure/logging/app-logger.ts` - app logger port and Nest implementation.
- Create: `src/shared/presentation/responses/api-response.ts` - success, pagination, and error envelope types.
- Create: `src/shared/presentation/middleware/trace-id.middleware.ts` - trace id propagation middleware.
- Create: `src/shared/presentation/middleware/request-logging.middleware.ts` - completion request logging middleware.
- Create: `src/shared/presentation/decorators/trace-id.decorator.ts` - controller decorator for explicit trace id access.
- Create: `src/shared/presentation/interceptors/response-envelope.interceptor.ts` - global success envelope interceptor.
- Create: `src/shared/presentation/filters/http-exception.filter.ts` - global error envelope filter.
- Test: `src/shared/presentation/filters/http-exception.filter.spec.ts` - exception mapping unit tests.
- Create: `src/shared/presentation/types/http-request-with-trace.ts` - request extension type.
- Create: `src/modules/health/application/get-health-status.use-case.ts` - health application use case.
- Modify: `src/modules/health/health.module.ts` - provide health use case.
- Modify: `src/modules/health/presentation/health.controller.ts` - call use case.
- Modify: `test/app.e2e-spec.ts` - register M1 pipeline and assert response envelope/trace id.
- Modify: `README.md` - document M1 behavior and security env variables.

## Task 1: Add Security Dependencies And Config

**Files:**
- Modify: `package.json`
- Modify: `bun.lock`
- Modify: `.env.example`
- Modify: `.env.development`
- Modify: `.env.test`
- Modify: `src/bootstrap/config/app-config.ts`

- [ ] **Step 1: Install security dependencies**

Run:

```bash
bun add @nestjs/throttler helmet
```

Expected: command succeeds, `package.json` contains `@nestjs/throttler` and `helmet`, and `bun.lock` is updated.

- [ ] **Step 2: Add security variables to env files**

Update `.env.example`:

```dotenv
NODE_ENV=development
APP_NAME=nestjs-bootstrap
APP_PORT=3000
API_PREFIX=api
API_VERSION=1
SWAGGER_ENABLED=true
SWAGGER_PATH=docs
CORS_ENABLED=true
CORS_ORIGIN=*
RATE_LIMIT_TTL_SECONDS=60
RATE_LIMIT_MAX=100
```

Update `.env.development`:

```dotenv
NODE_ENV=development
APP_NAME=nestjs-bootstrap
APP_PORT=3000
API_PREFIX=api
API_VERSION=1
SWAGGER_ENABLED=true
SWAGGER_PATH=docs
CORS_ENABLED=true
CORS_ORIGIN=*
RATE_LIMIT_TTL_SECONDS=60
RATE_LIMIT_MAX=100
```

Update `.env.test`:

```dotenv
NODE_ENV=test
APP_NAME=nestjs-bootstrap-test
APP_PORT=3001
API_PREFIX=api
API_VERSION=1
SWAGGER_ENABLED=false
SWAGGER_PATH=docs
CORS_ENABLED=true
CORS_ORIGIN=*
RATE_LIMIT_TTL_SECONDS=60
RATE_LIMIT_MAX=1000
```

- [ ] **Step 3: Update config validation and app config**

Replace `src/bootstrap/config/app-config.ts` with:

```ts
import { plainToInstance } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

enum NodeEnvironment {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

class EnvironmentVariables {
  @IsEnum(NodeEnvironment)
  NODE_ENV!: NodeEnvironment;

  @IsString()
  @IsNotEmpty()
  APP_NAME!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  APP_PORT!: number;

  @IsString()
  @IsNotEmpty()
  API_PREFIX!: string;

  @IsString()
  @IsNotEmpty()
  API_VERSION!: string;

  @IsBoolean()
  SWAGGER_ENABLED!: boolean;

  @IsString()
  @IsNotEmpty()
  SWAGGER_PATH!: string;

  @IsBoolean()
  CORS_ENABLED!: boolean;

  @IsString()
  @IsNotEmpty()
  CORS_ORIGIN!: string;

  @IsInt()
  @Min(1)
  RATE_LIMIT_TTL_SECONDS!: number;

  @IsInt()
  @Min(1)
  RATE_LIMIT_MAX!: number;
}

function parseBooleanEnvironmentValue(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return undefined;
}

export type AppConfig = {
  nodeEnv: NodeEnvironment;
  appName: string;
  port: number;
  apiPrefix: string;
  apiVersion: string;
  swagger: {
    enabled: boolean;
    path: string;
  };
  security: {
    cors: {
      enabled: boolean;
      origin: string | string[];
    };
    rateLimit: {
      ttlSeconds: number;
      max: number;
    };
  };
};

function parseCorsOrigin(value: string | undefined): string | string[] {
  if (!value || value === '*') {
    return '*';
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

export function validateEnvironment(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance(
    EnvironmentVariables,
    {
      ...config,
      SWAGGER_ENABLED: parseBooleanEnvironmentValue(config.SWAGGER_ENABLED),
      CORS_ENABLED: parseBooleanEnvironmentValue(config.CORS_ENABLED),
    },
    {
      enableImplicitConversion: true,
    },
  );

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}

export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV as NodeEnvironment,
  appName: process.env.APP_NAME ?? 'nestjs-bootstrap',
  port: Number(process.env.APP_PORT ?? 3000),
  apiPrefix: process.env.API_PREFIX ?? 'api',
  apiVersion: process.env.API_VERSION ?? '1',
  swagger: {
    enabled: process.env.SWAGGER_ENABLED === 'true',
    path: process.env.SWAGGER_PATH ?? 'docs',
  },
  security: {
    cors: {
      enabled: process.env.CORS_ENABLED === 'true',
      origin: parseCorsOrigin(process.env.CORS_ORIGIN),
    },
    rateLimit: {
      ttlSeconds: Number(process.env.RATE_LIMIT_TTL_SECONDS ?? 60),
      max: Number(process.env.RATE_LIMIT_MAX ?? 100),
    },
  },
});
```

- [ ] **Step 4: Run config-focused checks**

Run:

```bash
bun run check
bun run build
```

Expected: both commands pass.

- [ ] **Step 5: Commit config and dependency changes**

Run:

```bash
git add package.json bun.lock .env.example .env.development .env.test src/bootstrap/config/app-config.ts
git commit -m "feat: add security configuration"
```

Expected: commit succeeds.

## Task 2: Add Shared Error And Pagination Primitives

**Files:**
- Create: `src/shared/domain/errors/domain-error.ts`
- Create: `src/shared/application/errors/application-error.ts`
- Create: `src/shared/application/pagination/pagination.ts`
- Test: `src/shared/application/pagination/pagination.spec.ts`

- [ ] **Step 1: Write pagination tests first**

Create `src/shared/application/pagination/pagination.spec.ts`:

```ts
import { createPaginationMeta, normalizePaginationQuery } from './pagination';

describe('pagination helpers', () => {
  it('uses default page and limit when query values are missing', () => {
    expect(normalizePaginationQuery({})).toEqual({
      page: 1,
      limit: 20,
    });
  });

  it('normalizes invalid page and limit to minimum values', () => {
    expect(normalizePaginationQuery({ page: 0, limit: 0 })).toEqual({
      page: 1,
      limit: 1,
    });
  });

  it('caps limit at the maximum value', () => {
    expect(normalizePaginationQuery({ page: 2, limit: 500 })).toEqual({
      page: 2,
      limit: 100,
    });
  });

  it('calculates total pages from total and limit', () => {
    expect(createPaginationMeta({ page: 2, limit: 20, total: 95 })).toEqual({
      page: 2,
      limit: 20,
      total: 95,
      totalPages: 5,
    });
  });
});
```

- [ ] **Step 2: Run pagination test to verify it fails**

Run:

```bash
bun run test -- src/shared/application/pagination/pagination.spec.ts
```

Expected: FAIL because `./pagination` does not exist.

- [ ] **Step 3: Add domain error primitive**

Create `src/shared/domain/errors/domain-error.ts`:

```ts
export enum DomainErrorCategory {
  Validation = 'VALIDATION',
  Conflict = 'CONFLICT',
}

export type DomainErrorOptions = {
  code: string;
  message: string;
  category: DomainErrorCategory;
  details?: unknown;
};

export class DomainError extends Error {
  readonly code: string;
  readonly category: DomainErrorCategory;
  readonly details?: unknown;

  constructor(options: DomainErrorOptions) {
    super(options.message);
    this.name = 'DomainError';
    this.code = options.code;
    this.category = options.category;
    this.details = options.details;
  }
}
```

- [ ] **Step 4: Add application error primitive**

Create `src/shared/application/errors/application-error.ts`:

```ts
export enum ApplicationErrorCategory {
  NotFound = 'NOT_FOUND',
  Conflict = 'CONFLICT',
  Unauthorized = 'UNAUTHORIZED',
  Forbidden = 'FORBIDDEN',
}

export type ApplicationErrorOptions = {
  code: string;
  message: string;
  category: ApplicationErrorCategory;
  details?: unknown;
};

export class ApplicationError extends Error {
  readonly code: string;
  readonly category: ApplicationErrorCategory;
  readonly details?: unknown;

  constructor(options: ApplicationErrorOptions) {
    super(options.message);
    this.name = 'ApplicationError';
    this.code = options.code;
    this.category = options.category;
    this.details = options.details;
  }
}
```

- [ ] **Step 5: Add pagination implementation**

Create `src/shared/application/pagination/pagination.ts`:

```ts
export type PaginationQuery = {
  page?: number;
  limit?: number;
};

export type NormalizedPaginationQuery = {
  page: number;
  limit: number;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResult<T> = {
  items: T[];
  pagination: PaginationMeta;
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MIN_PAGE = 1;
const MIN_LIMIT = 1;
const MAX_LIMIT = 100;

function normalizePositiveInteger(value: number | undefined, fallback: number): number {
  if (!Number.isInteger(value)) {
    return fallback;
  }

  return value;
}

export function normalizePaginationQuery(query: PaginationQuery): NormalizedPaginationQuery {
  const page = Math.max(MIN_PAGE, normalizePositiveInteger(query.page, DEFAULT_PAGE));
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(MIN_LIMIT, normalizePositiveInteger(query.limit, DEFAULT_LIMIT)),
  );

  return { page, limit };
}

export function createPaginationMeta(input: {
  page: number;
  limit: number;
  total: number;
}): PaginationMeta {
  return {
    page: input.page,
    limit: input.limit,
    total: input.total,
    totalPages: Math.ceil(input.total / input.limit),
  };
}

export function createPaginatedResult<T>(input: {
  items: T[];
  page: number;
  limit: number;
  total: number;
}): PaginatedResult<T> {
  return {
    items: input.items,
    pagination: createPaginationMeta({
      page: input.page,
      limit: input.limit,
      total: input.total,
    }),
  };
}

export function isPaginatedResult<T>(value: unknown): value is PaginatedResult<T> {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return 'items' in value && 'pagination' in value;
}
```

- [ ] **Step 6: Run unit tests**

Run:

```bash
bun run test -- src/shared/application/pagination/pagination.spec.ts
```

Expected: PASS.

- [ ] **Step 7: Run checks and commit**

Run:

```bash
bun run check
bun run test -- src/shared/application/pagination/pagination.spec.ts
git add src/shared/domain/errors/domain-error.ts src/shared/application/errors/application-error.ts src/shared/application/pagination
git commit -m "feat: add shared application primitives"
```

Expected: checks pass and commit succeeds.

## Task 3: Add Response Envelope And Exception Filter

**Files:**
- Create: `src/shared/presentation/responses/api-response.ts`
- Create: `src/shared/presentation/types/http-request-with-trace.ts`
- Create: `src/shared/presentation/filters/http-exception.filter.ts`
- Test: `src/shared/presentation/filters/http-exception.filter.spec.ts`

- [ ] **Step 1: Add response and request types**

Create `src/shared/presentation/responses/api-response.ts`:

```ts
import type { PaginationMeta } from '../../../application/pagination/pagination';

export type ApiResponseMeta = {
  traceId: string;
  pagination?: PaginationMeta;
};

export type ApiSuccessResponse<T> = {
  data: T;
  meta: ApiResponseMeta;
};

export type ApiErrorBody = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiErrorResponse = {
  error: ApiErrorBody;
  meta: ApiResponseMeta;
};
```

Create `src/shared/presentation/types/http-request-with-trace.ts`:

```ts
import type { Request } from 'express';

export type HttpRequestWithTrace = Request & {
  traceId?: string;
};
```

- [ ] **Step 2: Write exception filter tests first**

Create `src/shared/presentation/filters/http-exception.filter.spec.ts`:

```ts
import { BadRequestException, HttpException } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';
import {
  ApplicationError,
  ApplicationErrorCategory,
} from '../../../application/errors/application-error';
import { DomainError, DomainErrorCategory } from '../../../domain/errors/domain-error';

type MockResponse = {
  statusCode?: number;
  body?: unknown;
  status: jest.Mock;
  json: jest.Mock;
};

function createHost(exception: unknown, traceId = 'trace-test-id') {
  const response: MockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockImplementation((body: unknown) => {
      response.body = body;
      return response;
    }),
  };

  const request = { traceId };

  const host = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  };

  new HttpExceptionFilter().catch(exception, host as never);

  return response;
}

describe('HttpExceptionFilter', () => {
  it('maps application errors by category', () => {
    const response = createHost(
      new ApplicationError({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Resource not found',
        category: ApplicationErrorCategory.NotFound,
      }),
    );

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.body).toEqual({
      error: {
        code: 'RESOURCE_NOT_FOUND',
        message: 'Resource not found',
      },
      meta: {
        traceId: 'trace-test-id',
      },
    });
  });

  it('maps domain errors by category', () => {
    const response = createHost(
      new DomainError({
        code: 'EMAIL_ALREADY_USED',
        message: 'Email already used',
        category: DomainErrorCategory.Conflict,
      }),
    );

    expect(response.status).toHaveBeenCalledWith(409);
    expect(response.body).toEqual({
      error: {
        code: 'EMAIL_ALREADY_USED',
        message: 'Email already used',
      },
      meta: {
        traceId: 'trace-test-id',
      },
    });
  });

  it('keeps http exception status and standardizes body', () => {
    const response = createHost(new BadRequestException('Invalid request'));

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.body).toEqual({
      error: {
        code: 'BAD_REQUEST',
        message: 'Invalid request',
      },
      meta: {
        traceId: 'trace-test-id',
      },
    });
  });

  it('hides unknown error details', () => {
    const response = createHost(new Error('database password leaked'));

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.body).toEqual({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
      },
      meta: {
        traceId: 'trace-test-id',
      },
    });
  });

  it('uses validation code for class-validator bad request arrays', () => {
    const response = createHost(new HttpException(['name must be a string'], 400));

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: ['name must be a string'],
      },
      meta: {
        traceId: 'trace-test-id',
      },
    });
  });
});
```

- [ ] **Step 3: Run exception filter tests to verify they fail**

Run:

```bash
bun run test -- src/shared/presentation/filters/http-exception.filter.spec.ts
```

Expected: FAIL because `http-exception.filter.ts` does not exist.

- [ ] **Step 4: Add exception filter implementation**

Create `src/shared/presentation/filters/http-exception.filter.ts`:

```ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApplicationError,
  ApplicationErrorCategory,
} from '../../../application/errors/application-error';
import { DomainError, DomainErrorCategory } from '../../../domain/errors/domain-error';
import type { ApiErrorBody, ApiErrorResponse } from '../responses/api-response';
import type { HttpRequestWithTrace } from '../types/http-request-with-trace';

const DEFAULT_TRACE_ID = 'unknown';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<HttpRequestWithTrace>();
    const response = http.getResponse<Response>();
    const mapped = mapException(exception);

    response.status(mapped.status).json({
      error: mapped.error,
      meta: {
        traceId: request.traceId ?? DEFAULT_TRACE_ID,
      },
    } satisfies ApiErrorResponse);
  }
}

function mapException(exception: unknown): { status: number; error: ApiErrorBody } {
  if (exception instanceof ApplicationError) {
    return mapApplicationError(exception);
  }

  if (exception instanceof DomainError) {
    return mapDomainError(exception);
  }

  if (exception instanceof HttpException) {
    return mapHttpException(exception);
  }

  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    },
  };
}

function mapApplicationError(exception: ApplicationError): { status: number; error: ApiErrorBody } {
  const statusByCategory: Record<ApplicationErrorCategory, number> = {
    [ApplicationErrorCategory.NotFound]: HttpStatus.NOT_FOUND,
    [ApplicationErrorCategory.Conflict]: HttpStatus.CONFLICT,
    [ApplicationErrorCategory.Unauthorized]: HttpStatus.UNAUTHORIZED,
    [ApplicationErrorCategory.Forbidden]: HttpStatus.FORBIDDEN,
  };

  return {
    status: statusByCategory[exception.category],
    error: buildErrorBody(exception),
  };
}

function mapDomainError(exception: DomainError): { status: number; error: ApiErrorBody } {
  const statusByCategory: Record<DomainErrorCategory, number> = {
    [DomainErrorCategory.Validation]: HttpStatus.BAD_REQUEST,
    [DomainErrorCategory.Conflict]: HttpStatus.CONFLICT,
  };

  return {
    status: statusByCategory[exception.category],
    error: buildErrorBody(exception),
  };
}

function mapHttpException(exception: HttpException): { status: number; error: ApiErrorBody } {
  const status = exception.getStatus();
  const response = exception.getResponse();

  if (Array.isArray(response) && status === HttpStatus.BAD_REQUEST) {
    return {
      status,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: response,
      },
    };
  }

  if (typeof response === 'object' && response !== null) {
    const body = response as { error?: string; message?: string | string[] };
    const message = Array.isArray(body.message) ? body.message.join(', ') : body.message;

    if (Array.isArray(body.message) && status === HttpStatus.BAD_REQUEST) {
      return {
        status,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: body.message,
        },
      };
    }

    return {
      status,
      error: {
        code: toErrorCode(body.error ?? HttpStatus[status] ?? 'HTTP_ERROR'),
        message: message ?? exception.message,
      },
    };
  }

  return {
    status,
    error: {
      code: toErrorCode(HttpStatus[status] ?? 'HTTP_ERROR'),
      message: typeof response === 'string' ? response : exception.message,
    },
  };
}

function buildErrorBody(error: {
  code: string;
  message: string;
  details?: unknown;
}): ApiErrorBody {
  return {
    code: error.code,
    message: error.message,
    ...(error.details === undefined ? {} : { details: error.details }),
  };
}

function toErrorCode(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toUpperCase();
}
```

- [ ] **Step 5: Run exception filter tests**

Run:

```bash
bun run test -- src/shared/presentation/filters/http-exception.filter.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Run checks and commit**

Run:

```bash
bun run check
bun run test -- src/shared/presentation/filters/http-exception.filter.spec.ts
git add src/shared/presentation src/shared/application/errors src/shared/domain/errors
git commit -m "feat: add standard error envelopes"
```

Expected: checks pass and commit succeeds.

## Task 4: Add Trace Id, Request Logging, And Response Interceptor

**Files:**
- Create: `src/shared/infrastructure/logging/app-logger.ts`
- Create: `src/shared/presentation/middleware/trace-id.middleware.ts`
- Create: `src/shared/presentation/middleware/request-logging.middleware.ts`
- Create: `src/shared/presentation/decorators/trace-id.decorator.ts`
- Create: `src/shared/presentation/interceptors/response-envelope.interceptor.ts`

- [ ] **Step 1: Add app logger abstraction**

Create `src/shared/infrastructure/logging/app-logger.ts`:

```ts
import { Injectable, Logger } from '@nestjs/common';

export type RequestLogEntry = {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  traceId: string;
};

export abstract class AppLogger {
  abstract logRequest(entry: RequestLogEntry): void;
}

@Injectable()
export class NestAppLogger implements AppLogger {
  private readonly logger = new Logger('HTTP');

  logRequest(entry: RequestLogEntry): void {
    this.logger.log(
      JSON.stringify({
        method: entry.method,
        path: entry.path,
        statusCode: entry.statusCode,
        durationMs: entry.durationMs,
        traceId: entry.traceId,
      }),
    );
  }
}
```

- [ ] **Step 2: Add trace id middleware**

Create `src/shared/presentation/middleware/trace-id.middleware.ts`:

```ts
import { randomUUID } from 'node:crypto';
import type { NextFunction, Response } from 'express';
import type { HttpRequestWithTrace } from '../types/http-request-with-trace';

export const TRACE_ID_HEADER = 'x-trace-id';

export function traceIdMiddleware(
  request: HttpRequestWithTrace,
  response: Response,
  next: NextFunction,
): void {
  const headerValue = request.header(TRACE_ID_HEADER);
  const traceId = headerValue && headerValue.trim().length > 0 ? headerValue : randomUUID();

  request.traceId = traceId;
  response.setHeader(TRACE_ID_HEADER, traceId);
  next();
}
```

- [ ] **Step 3: Add request logging middleware**

Create `src/shared/presentation/middleware/request-logging.middleware.ts`:

```ts
import type { NextFunction, Response } from 'express';
import type { AppLogger } from '../../../infrastructure/logging/app-logger';
import type { HttpRequestWithTrace } from '../types/http-request-with-trace';

export function createRequestLoggingMiddleware(appLogger: AppLogger) {
  return (request: HttpRequestWithTrace, response: Response, next: NextFunction): void => {
    const startedAt = process.hrtime.bigint();

    response.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

      appLogger.logRequest({
        method: request.method,
        path: request.originalUrl,
        statusCode: response.statusCode,
        durationMs: Math.round(durationMs),
        traceId: request.traceId ?? 'unknown',
      });
    });

    next();
  };
}
```

- [ ] **Step 4: Add trace id decorator**

Create `src/shared/presentation/decorators/trace-id.decorator.ts`:

```ts
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { HttpRequestWithTrace } from '../types/http-request-with-trace';

export const TraceId = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<HttpRequestWithTrace>();
  return request.traceId;
});
```

- [ ] **Step 5: Add response envelope interceptor**

Create `src/shared/presentation/interceptors/response-envelope.interceptor.ts`:

```ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, type Observable } from 'rxjs';
import { isPaginatedResult } from '../../../application/pagination/pagination';
import type { ApiSuccessResponse } from '../responses/api-response';
import type { HttpRequestWithTrace } from '../types/http-request-with-trace';

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<HttpRequestWithTrace>();

    return next.handle().pipe(
      map((value: unknown) => {
        const traceId = request.traceId ?? 'unknown';

        if (isPaginatedResult(value)) {
          return {
            data: value.items,
            meta: {
              traceId,
              pagination: value.pagination,
            },
          } satisfies ApiSuccessResponse<unknown[]>;
        }

        return {
          data: value,
          meta: {
            traceId,
          },
        } satisfies ApiSuccessResponse<unknown>;
      }),
    );
  }
}
```

- [ ] **Step 6: Run checks**

Run:

```bash
bun run check
bun run build
```

Expected: both commands pass.

- [ ] **Step 7: Commit trace, logging, and response envelope components**

Run:

```bash
git add src/shared/infrastructure/logging src/shared/presentation/middleware src/shared/presentation/decorators src/shared/presentation/interceptors
git commit -m "feat: add request tracing and response envelopes"
```

Expected: commit succeeds.

## Task 5: Wire Global Security And HTTP Pipeline

**Files:**
- Create: `src/bootstrap/security/setup-security.ts`
- Create: `src/bootstrap/http/setup-http-pipeline.ts`
- Modify: `src/app.module.ts`
- Modify: `src/main.ts`
- Modify: `test/app.e2e-spec.ts`

- [ ] **Step 1: Add security bootstrap**

Create `src/bootstrap/security/setup-security.ts`:

```ts
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import type { AppConfig } from '../config/app-config';

export function setupSecurity(app: INestApplication): void {
  const configService = app.get(ConfigService<AppConfig, true>);
  const securityConfig = configService.get('security', { infer: true });

  app.use(helmet());

  if (securityConfig.cors.enabled) {
    app.enableCors({
      origin: securityConfig.cors.origin,
    });
  }
}
```

- [ ] **Step 2: Add HTTP pipeline setup**

Create `src/bootstrap/http/setup-http-pipeline.ts`:

```ts
import type { INestApplication } from '@nestjs/common';
import { HttpExceptionFilter } from '../../shared/presentation/filters/http-exception.filter';
import { ResponseEnvelopeInterceptor } from '../../shared/presentation/interceptors/response-envelope.interceptor';
import { createRequestLoggingMiddleware } from '../../shared/presentation/middleware/request-logging.middleware';
import { traceIdMiddleware } from '../../shared/presentation/middleware/trace-id.middleware';
import {
  AppLogger,
  NestAppLogger,
} from '../../shared/infrastructure/logging/app-logger';

export function setupHttpPipeline(app: INestApplication): void {
  const appLogger = app.get<AppLogger>(NestAppLogger);

  app.use(traceIdMiddleware);
  app.use(createRequestLoggingMiddleware(appLogger));
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
}
```

- [ ] **Step 3: Register ThrottlerModule and logger provider**

Replace `src/app.module.ts` with:

```ts
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from './bootstrap/config/config.module';
import type { AppConfig } from './bootstrap/config/app-config';
import { HealthModule } from './modules/health/health.module';
import { NestAppLogger } from './shared/infrastructure/logging/app-logger';

@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => {
        const rateLimit = configService.get('security.rateLimit', { infer: true });

        return {
          throttlers: [
            {
              ttl: rateLimit.ttlSeconds * 1000,
              limit: rateLimit.max,
            },
          ],
        };
      },
    }),
    HealthModule,
  ],
  providers: [
    NestAppLogger,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

- [ ] **Step 4: Wire bootstrap setup in main**

Replace `src/main.ts` with:

```ts
import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import type { AppConfig } from './bootstrap/config/app-config';
import { setupHttpPipeline } from './bootstrap/http/setup-http-pipeline';
import { setupSecurity } from './bootstrap/security/setup-security';
import { setupSwagger } from './bootstrap/swagger/setup-swagger';
import { setupValidation } from './bootstrap/validation/setup-validation';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<AppConfig, true>);

  const apiPrefix = configService.get('apiPrefix', { infer: true });
  const apiVersion = configService.get('apiVersion', { infer: true });
  const port = configService.get('port', { infer: true });

  setupSecurity(app);

  app.setGlobalPrefix(apiPrefix);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: apiVersion,
  });

  setupValidation(app);
  setupHttpPipeline(app);
  setupSwagger(app);

  await app.listen(port);
}

void bootstrap();
```

- [ ] **Step 5: Update e2e setup to use the same pipeline**

In `test/app.e2e-spec.ts`, add imports:

```ts
import { setupHttpPipeline } from '../src/bootstrap/http/setup-http-pipeline';
import { setupSecurity } from '../src/bootstrap/security/setup-security';
```

Then update `beforeAll` so the setup order matches `main.ts`:

```ts
    setupSecurity(app);
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    setupValidation(app);
    setupHttpPipeline(app);
    await app.init();
```

- [ ] **Step 6: Run build to catch wiring issues**

Run:

```bash
bun run build
```

Expected: PASS.

- [ ] **Step 7: Commit global pipeline wiring**

Run:

```bash
git add src/bootstrap/security src/bootstrap/http src/app.module.ts src/main.ts test/app.e2e-spec.ts
git commit -m "feat: wire global http pipeline"
```

Expected: commit succeeds.

## Task 6: Refactor Health Module And Update E2E Tests

**Files:**
- Create: `src/modules/health/application/get-health-status.use-case.ts`
- Modify: `src/modules/health/health.module.ts`
- Modify: `src/modules/health/presentation/health.controller.ts`
- Modify: `test/app.e2e-spec.ts`

- [ ] **Step 1: Update e2e tests for envelope and trace id**

Replace the test case in `test/app.e2e-spec.ts` with:

```ts
  it('returns application health in the standard response envelope', async () => {
    const response = await request(app.getHttpServer()).get('/api/health').expect(200);

    expect(response.body).toEqual({
      data: {
        status: 'ok',
      },
      meta: {
        traceId: expect.any(String),
      },
    });
    expect(response.headers['x-trace-id']).toBe(response.body.meta.traceId);
  });

  it('reuses provided trace id in response header and body metadata', async () => {
    const traceId = 'test-trace-id';

    const response = await request(app.getHttpServer())
      .get('/api/health')
      .set('x-trace-id', traceId)
      .expect(200);

    expect(response.headers['x-trace-id']).toBe(traceId);
    expect(response.body.meta.traceId).toBe(traceId);
  });
```

- [ ] **Step 2: Run e2e test to verify it fails**

Run:

```bash
bun run test:e2e
```

Expected: FAIL until the health use case is wired and the global envelope is active.

- [ ] **Step 3: Add health use case**

Create `src/modules/health/application/get-health-status.use-case.ts`:

```ts
import { Injectable } from '@nestjs/common';

export type HealthStatus = {
  status: 'ok';
};

@Injectable()
export class GetHealthStatusUseCase {
  execute(): HealthStatus {
    return { status: 'ok' };
  }
}
```

- [ ] **Step 4: Register health use case**

Replace `src/modules/health/health.module.ts` with:

```ts
import { Module } from '@nestjs/common';
import { GetHealthStatusUseCase } from './application/get-health-status.use-case';
import { HealthController } from './presentation/health.controller';

@Module({
  controllers: [HealthController],
  providers: [GetHealthStatusUseCase],
})
export class HealthModule {}
```

- [ ] **Step 5: Update health controller**

Replace `src/modules/health/presentation/health.controller.ts` with:

```ts
import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  GetHealthStatusUseCase,
  type HealthStatus,
} from '../application/get-health-status.use-case';

@ApiTags('health')
@Controller({
  path: 'health',
  version: VERSION_NEUTRAL,
})
export class HealthController {
  constructor(private readonly getHealthStatus: GetHealthStatusUseCase) {}

  @Get()
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
          },
          required: ['status'],
        },
        meta: {
          type: 'object',
          properties: {
            traceId: { type: 'string', example: '018f4f6f-55f2-77c0-8b07-b44c3b6f94d5' },
          },
          required: ['traceId'],
        },
      },
      required: ['data', 'meta'],
    },
  })
  getHealth(): HealthStatus {
    return this.getHealthStatus.execute();
  }
}
```

- [ ] **Step 6: Run e2e tests**

Run:

```bash
bun run test:e2e
```

Expected: PASS.

- [ ] **Step 7: Run checks and commit**

Run:

```bash
bun run check
bun run build
bun run test:e2e
git add src/modules/health test/app.e2e-spec.ts
git commit -m "feat: refactor health through use case"
```

Expected: all commands pass and commit succeeds.

## Task 7: Final Verification And Documentation

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update README current milestone and env docs**

Update the "Current Milestone" list in `README.md` so it includes M1:

```markdown
M0 foundation and M1 common layer are implemented:

- NestJS application shell
- Bun package scripts
- TypeScript strict mode
- Biome format/lint configuration
- typed environment validation
- URI API versioning
- Swagger setup for development
- standard `{ data, meta }` success response envelope
- standard `{ error, meta }` error response envelope
- trace id propagation with `x-trace-id`
- request logging with method, path, status, duration, and trace id
- basic Helmet, CORS, and rate limiting setup
- neutral `/api/health` endpoint through an application use case
- unit and e2e tests for the common pipeline
```

Add these rows to the environment table:

```markdown
| `CORS_ENABLED` | `true` | Enables CORS |
| `CORS_ORIGIN` | `*` | Comma-separated allowed origins or `*` |
| `RATE_LIMIT_TTL_SECONDS` | `60` | Rate limit window in seconds |
| `RATE_LIMIT_MAX` | `100` | Maximum requests per rate limit window |
```

Update the health response example:

```bash
curl -H 'x-trace-id: local-test' http://localhost:3000/api/health
```

Expected response shape:

```json
{
  "data": {
    "status": "ok"
  },
  "meta": {
    "traceId": "local-test"
  }
}
```

- [ ] **Step 2: Run full verification**

Run:

```bash
bun run check
bun run build
bun run test
bun run test:e2e
```

Expected: all commands pass.

- [ ] **Step 3: Check git status**

Run:

```bash
git status --short
```

Expected: only intentional README changes are listed, plus any pre-existing untracked `AGENTS.md` if it remains untracked.

- [ ] **Step 4: Commit documentation**

Run:

```bash
git add README.md
git commit -m "docs: document m1 common layer"
```

Expected: commit succeeds.

- [ ] **Step 5: Final status check**

Run:

```bash
git status --short
git log --oneline -5
```

Expected: working tree is clean except pre-existing untracked `AGENTS.md`; recent commits show the M1 implementation commits.
