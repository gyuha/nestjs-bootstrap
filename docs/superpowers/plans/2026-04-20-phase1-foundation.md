# Phase 1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** NestJS DDD Bootstrap 프로젝트의 기반(Foundation)을 구성한다 — Config 검증, 로깅, 보안, Swagger, 공통 응답 포맷, API 버저닝, Health check 엔드포인트.

**Architecture:** `bootstrap/` 모듈로 앱 초기화 관심사를 분리하고, `shared/presentation/`에 공통 응답 포맷을 정의한다. 모든 bootstrap 기능은 `main.ts`에서 단계적으로 조립된다. Zod는 앱 시작 전 환경변수를 검증하며, 잘못된 값이 있으면 즉시 실패(fail-fast)한다.

**Tech Stack:** Bun, NestJS 11.x, TypeScript (strict), Zod, nestjs-pino, Helmet, @nestjs/throttler, @nestjs/swagger, Jest (ts-jest), supertest

---

## 파일 구조 맵

아래 파일들이 이 계획에서 생성된다:

```
nestjs-bootstrap/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── bootstrap/
│   │   ├── validation/
│   │   │   └── env.schema.ts
│   │   ├── logging/
│   │   │   ├── pino.config.ts
│   │   │   └── trace.middleware.ts
│   │   ├── security/
│   │   │   └── security.setup.ts
│   │   └── swagger/
│   │       └── swagger.setup.ts
│   ├── shared/
│   │   ├── domain/          (빈 디렉토리 — Phase 2~)
│   │   ├── application/     (빈 디렉토리 — Phase 2~)
│   │   ├── infrastructure/  (빈 디렉토리 — Phase 2~)
│   │   └── presentation/
│   │       ├── dto/
│   │       │   └── api-response.dto.ts
│   │       ├── interceptors/
│   │       │   └── transform.interceptor.ts
│   │       └── filters/
│   │           └── http-exception.filter.ts
│   └── modules/
│       └── health/
│           ├── health.controller.ts
│           └── health.module.ts
├── test/
│   ├── jest-e2e.json
│   └── health.e2e-spec.ts
├── .env.development
├── .env.test
├── .env.production
├── .env.example
├── .gitignore
├── biome.json
├── tsconfig.json
└── package.json
```

테스트 파일 (src/ 안에 위치, Jest rootDir = src):
```
src/
├── bootstrap/validation/env.schema.spec.ts
├── bootstrap/logging/trace.middleware.spec.ts
├── shared/presentation/interceptors/transform.interceptor.spec.ts
└── shared/presentation/filters/http-exception.filter.spec.ts
```

---

## Task 1: 프로젝트 초기화 (Bun + NestJS + TypeScript + Biome)

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `biome.json`
- Create: `.gitignore`

- [ ] **Step 1: package.json 생성**

```bash
bun init -y
```

그런 다음 `package.json`을 다음 내용으로 교체:

```json
{
  "name": "nestjs-bootstrap",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "node dist/main",
    "start:dev": "NODE_ENV=development nest start --watch",
    "start:prod": "NODE_ENV=production node dist/main",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config test/jest-e2e.json",
    "lint": "biome lint src",
    "format": "biome format src --write",
    "check": "biome check src"
  },
  "dependencies": {},
  "devDependencies": {},
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": ["**/*.(t|j)s"],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
```

- [ ] **Step 2: NestJS 및 의존 패키지 설치**

```bash
bun add @nestjs/common @nestjs/core @nestjs/platform-express @nestjs/config \
  @nestjs/swagger @nestjs/throttler \
  nestjs-pino pino-http \
  helmet zod \
  reflect-metadata rxjs \
  swagger-ui-express
```

- [ ] **Step 3: 개발 의존 패키지 설치**

```bash
bun add -d @nestjs/cli @nestjs/schematics @nestjs/testing \
  @biomejs/biome \
  @types/express @types/jest @types/node @types/supertest \
  jest ts-jest ts-node typescript \
  pino-pretty supertest
```

- [ ] **Step 4: tsconfig.json 생성**

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strict": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

- [ ] **Step 5: biome.json 생성**

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": { "recommended": true }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all",
      "semicolons": "always"
    }
  },
  "files": {
    "ignore": ["dist/**", "node_modules/**", "coverage/**"]
  }
}
```

- [ ] **Step 6: .gitignore 업데이트**

```
# env files (절대 커밋 금지)
.env.development
.env.test
.env.production

# build
dist/
node_modules/
coverage/

# local db
*.db
*.db-journal
```

- [ ] **Step 7: jest-e2e.json 생성**

`test/jest-e2e.json`:
```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  }
}
```

- [ ] **Step 8: src 디렉토리 구조 생성**

```bash
mkdir -p src/bootstrap/validation \
  src/bootstrap/logging \
  src/bootstrap/security \
  src/bootstrap/swagger \
  src/shared/domain \
  src/shared/application \
  src/shared/infrastructure \
  src/shared/presentation/dto \
  src/shared/presentation/interceptors \
  src/shared/presentation/filters \
  src/modules/health \
  test
```

- [ ] **Step 9: 커밋**

```bash
git add package.json tsconfig.json biome.json .gitignore test/jest-e2e.json
git commit -m "chore: initialize Bun + NestJS project with TypeScript and Biome"
```

---

## Task 2: 환경 파일 생성

**Files:**
- Create: `.env.example`
- Create: `.env.development`
- Create: `.env.test`
- Create: `.env.production`

- [ ] **Step 1: .env.example 생성 (커밋됨)**

```bash
cat > .env.example << 'EOF'
# Application
NODE_ENV=development
PORT=3000

# Database (SQLite for dev, PostgreSQL for prod)
DATABASE_URL=file:./dev.db

# Redis (optional for dev)
# REDIS_URL=redis://localhost:6379

# JWT (최소 32자)
JWT_SECRET=change-this-to-a-secret-of-at-least-32-chars

# CORS (쉼표로 복수 도메인 구분)
ALLOWED_ORIGINS=http://localhost:3000
EOF
```

- [ ] **Step 2: .env.development 생성 (커밋 안 됨)**

```bash
cat > .env.development << 'EOF'
NODE_ENV=development
PORT=3000
DATABASE_URL=file:./dev.db
JWT_SECRET=dev-secret-key-must-be-at-least-32-chars-long
ALLOWED_ORIGINS=http://localhost:3000
EOF
```

- [ ] **Step 3: .env.test 생성 (커밋 안 됨)**

```bash
cat > .env.test << 'EOF'
NODE_ENV=test
PORT=3001
DATABASE_URL=:memory:
JWT_SECRET=test-secret-key-must-be-at-least-32-chars-long
ALLOWED_ORIGINS=http://localhost:3000
EOF
```

- [ ] **Step 4: .env.production 생성 (커밋 안 됨)**

```bash
cat > .env.production << 'EOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/nestjs_bootstrap
REDIS_URL=redis://localhost:6379
JWT_SECRET=REPLACE_WITH_STRONG_SECRET_AT_LEAST_32_CHARS
ALLOWED_ORIGINS=https://your-domain.com
EOF
```

- [ ] **Step 5: 커밋 (.env.example만)**

```bash
git add .env.example
git commit -m "chore: add environment variable example file"
```

---

## Task 3: Zod 환경변수 검증 (TDD)

**Files:**
- Create: `src/bootstrap/validation/env.schema.ts`
- Create: `src/bootstrap/validation/env.schema.spec.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/bootstrap/validation/env.schema.spec.ts`:
```typescript
import { validateEnv } from './env.schema';

describe('validateEnv', () => {
  const validEnv = {
    NODE_ENV: 'development',
    PORT: '3000',
    DATABASE_URL: 'file:./dev.db',
    JWT_SECRET: 'a-secret-key-that-is-at-least-32-chars-long',
    ALLOWED_ORIGINS: 'http://localhost:3000',
  };

  it('returns parsed env when all required fields are valid', () => {
    const result = validateEnv(validEnv);
    expect(result.PORT).toBe(3000);
    expect(result.NODE_ENV).toBe('development');
    expect(result.DATABASE_URL).toBe('file:./dev.db');
  });

  it('coerces PORT string to number', () => {
    const result = validateEnv({ ...validEnv, PORT: '8080' });
    expect(result.PORT).toBe(8080);
  });

  it('applies default PORT of 3000 when PORT is omitted', () => {
    const { PORT: _PORT, ...rest } = validEnv;
    const result = validateEnv(rest);
    expect(result.PORT).toBe(3000);
  });

  it('throws when JWT_SECRET is shorter than 32 characters', () => {
    expect(() =>
      validateEnv({ ...validEnv, JWT_SECRET: 'too-short' }),
    ).toThrow('Environment validation failed');
  });

  it('throws when DATABASE_URL is missing', () => {
    const { DATABASE_URL: _DB, ...rest } = validEnv;
    expect(() => validateEnv(rest)).toThrow('Environment validation failed');
  });

  it('throws when NODE_ENV is not one of the allowed values', () => {
    expect(() =>
      validateEnv({ ...validEnv, NODE_ENV: 'staging' }),
    ).toThrow('Environment validation failed');
  });

  it('applies default ALLOWED_ORIGINS when omitted', () => {
    const { ALLOWED_ORIGINS: _AO, ...rest } = validEnv;
    const result = validateEnv(rest);
    expect(result.ALLOWED_ORIGINS).toBe('http://localhost:3000');
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
bun run test --testPathPattern=env.schema
```

Expected: `Cannot find module './env.schema'`

- [ ] **Step 3: env.schema.ts 구현**

`src/bootstrap/validation/env.schema.ts`:
```typescript
import { z } from 'zod';

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(32),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
});

export type Env = z.infer<typeof EnvSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = EnvSchema.safeParse(config);
  if (!result.success) {
    const errors = result.error.errors
      .map((e) => `  ${e.path.join('.')}: ${e.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${errors}`);
  }
  return result.data;
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
bun run test --testPathPattern=env.schema
```

Expected: `PASS src/bootstrap/validation/env.schema.spec.ts` (7 tests passed)

- [ ] **Step 5: 커밋**

```bash
git add src/bootstrap/validation/
git commit -m "feat: add Zod-based environment variable validation"
```

---

## Task 4: 공통 응답 타입 (DTO)

**Files:**
- Create: `src/shared/presentation/dto/api-response.dto.ts`

- [ ] **Step 1: api-response.dto.ts 생성**

`src/shared/presentation/dto/api-response.dto.ts`:
```typescript
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
```

- [ ] **Step 2: 커밋**

```bash
git add src/shared/presentation/dto/
git commit -m "feat: add common API response types"
```

---

## Task 5: TransformInterceptor (TDD)

**Files:**
- Create: `src/shared/presentation/interceptors/transform.interceptor.ts`
- Create: `src/shared/presentation/interceptors/transform.interceptor.spec.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/shared/presentation/interceptors/transform.interceptor.spec.ts`:
```typescript
import { ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { TransformInterceptor } from './transform.interceptor';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<unknown>;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
  });

  it('wraps object data in success format', (done) => {
    const next = { handle: () => of({ id: 1, name: 'test' }) };

    interceptor.intercept({} as ExecutionContext, next).subscribe((result) => {
      expect(result).toEqual({ success: true, data: { id: 1, name: 'test' } });
      done();
    });
  });

  it('wraps null data in success format', (done) => {
    const next = { handle: () => of(null) };

    interceptor.intercept({} as ExecutionContext, next).subscribe((result) => {
      expect(result).toEqual({ success: true, data: null });
      done();
    });
  });

  it('wraps array data in success format', (done) => {
    const next = { handle: () => of([1, 2, 3]) };

    interceptor.intercept({} as ExecutionContext, next).subscribe((result) => {
      expect(result).toEqual({ success: true, data: [1, 2, 3] });
      done();
    });
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
bun run test --testPathPattern=transform.interceptor
```

Expected: `Cannot find module './transform.interceptor'`

- [ ] **Step 3: TransformInterceptor 구현**

`src/shared/presentation/interceptors/transform.interceptor.ts`:
```typescript
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiSuccessResponse } from '../dto/api-response.dto';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiSuccessResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiSuccessResponse<T>> {
    return next.handle().pipe(map((data) => ({ success: true as const, data })));
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
bun run test --testPathPattern=transform.interceptor
```

Expected: `PASS` (3 tests passed)

- [ ] **Step 5: 커밋**

```bash
git add src/shared/presentation/interceptors/
git commit -m "feat: add TransformInterceptor for unified success response format"
```

---

## Task 6: HttpExceptionFilter (TDD)

**Files:**
- Create: `src/shared/presentation/filters/http-exception.filter.ts`
- Create: `src/shared/presentation/filters/http-exception.filter.spec.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/shared/presentation/filters/http-exception.filter.spec.ts`:
```typescript
import { HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockHost: any;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => ({ status: mockStatus }),
      }),
    };
  });

  it('formats HttpException with correct HTTP status', () => {
    filter.catch(
      new HttpException('Resource not found', HttpStatus.NOT_FOUND),
      mockHost,
    );

    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      error: { code: expect.any(String), message: 'Resource not found' },
    });
  });

  it('returns 500 INTERNAL_SERVER_ERROR for non-HTTP exceptions', () => {
    filter.catch(new Error('Unexpected crash'), mockHost);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' },
    });
  });

  it('extracts message from HttpException object response', () => {
    filter.catch(
      new HttpException({ message: 'Validation failed' }, HttpStatus.BAD_REQUEST),
      mockHost,
    );

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ message: 'Validation failed' }),
      }),
    );
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
bun run test --testPathPattern=http-exception.filter
```

Expected: `Cannot find module './http-exception.filter'`

- [ ] **Step 3: HttpExceptionFilter 구현**

`src/shared/presentation/filters/http-exception.filter.ts`:
```typescript
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiErrorResponse } from '../dto/api-response.dto';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp['message'] as string | undefined) ?? message;
      }
      code = exception.constructor.name
        .replace(/Exception$/, '')
        .replace(/([A-Z])/g, '_$1')
        .toUpperCase()
        .replace(/^_/, '');
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: { code, message },
    };

    response.status(status).json(errorResponse);
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
bun run test --testPathPattern=http-exception.filter
```

Expected: `PASS` (3 tests passed)

- [ ] **Step 5: 커밋**

```bash
git add src/shared/presentation/filters/
git commit -m "feat: add HttpExceptionFilter for unified error response format"
```

---

## Task 7: Pino Logger 설정

**Files:**
- Create: `src/bootstrap/logging/pino.config.ts`

- [ ] **Step 1: pino.config.ts 생성**

`src/bootstrap/logging/pino.config.ts`:
```typescript
import type { Params } from 'nestjs-pino';
import { randomUUID } from 'crypto';

export const pinoConfig: Params = {
  pinoHttp: {
    genReqId: (req) =>
      (req.headers['x-trace-id'] as string | undefined) ?? randomUUID(),
    level: process.env['NODE_ENV'] === 'production' ? 'info' : 'debug',
    transport:
      process.env['NODE_ENV'] !== 'production'
        ? {
            target: 'pino-pretty',
            options: { colorize: true, singleLine: false },
          }
        : undefined,
    autoLogging: true,
  },
};
```

- [ ] **Step 2: 커밋**

```bash
git add src/bootstrap/logging/pino.config.ts
git commit -m "feat: add Pino logger configuration"
```

---

## Task 8: Trace ID 미들웨어 (TDD)

**Files:**
- Create: `src/bootstrap/logging/trace.middleware.ts`
- Create: `src/bootstrap/logging/trace.middleware.spec.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/bootstrap/logging/trace.middleware.spec.ts`:
```typescript
import { TraceMiddleware } from './trace.middleware';

describe('TraceMiddleware', () => {
  let middleware: TraceMiddleware;

  beforeEach(() => {
    middleware = new TraceMiddleware();
  });

  it('passes through the X-Trace-Id header value if present', () => {
    const setHeader = jest.fn();
    const req = { headers: { 'x-trace-id': 'existing-trace-abc' } } as any;
    const res = { setHeader } as any;
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(setHeader).toHaveBeenCalledWith('X-Trace-Id', 'existing-trace-abc');
    expect(next).toHaveBeenCalled();
  });

  it('generates a UUID v4 when X-Trace-Id header is absent', () => {
    const setHeader = jest.fn();
    const req = { headers: {} } as any;
    const res = { setHeader } as any;
    const next = jest.fn();

    middleware.use(req, res, next);

    const [[headerName, traceId]] = setHeader.mock.calls;
    expect(headerName).toBe('X-Trace-Id');
    expect(traceId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(next).toHaveBeenCalled();
  });

  it('calls next() in both cases', () => {
    const next = jest.fn();
    const req = { headers: {} } as any;
    const res = { setHeader: jest.fn() } as any;

    middleware.use(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
bun run test --testPathPattern=trace.middleware
```

Expected: `Cannot find module './trace.middleware'`

- [ ] **Step 3: TraceMiddleware 구현**

`src/bootstrap/logging/trace.middleware.ts`:
```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

export const traceStore = new AsyncLocalStorage<{ traceId: string }>();

@Injectable()
export class TraceMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const traceId =
      (req.headers['x-trace-id'] as string | undefined) ?? randomUUID();
    res.setHeader('X-Trace-Id', traceId);
    traceStore.run({ traceId }, () => next());
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
bun run test --testPathPattern=trace.middleware
```

Expected: `PASS` (3 tests passed)

- [ ] **Step 5: 커밋**

```bash
git add src/bootstrap/logging/trace.middleware.ts src/bootstrap/logging/trace.middleware.spec.ts
git commit -m "feat: add TraceMiddleware for X-Trace-Id header propagation"
```

---

## Task 9: 보안 설정 (Helmet + CORS)

**Files:**
- Create: `src/bootstrap/security/security.setup.ts`

- [ ] **Step 1: security.setup.ts 생성**

`src/bootstrap/security/security.setup.ts`:
```typescript
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

export function setupSecurity(app: INestApplication): void {
  app.use(helmet());

  const config = app.get(ConfigService);
  const rawOrigins = config.get<string>('ALLOWED_ORIGINS', 'http://localhost:3000');
  const allowedOrigins = rawOrigins.split(',').map((o) => o.trim());

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Version', 'X-Trace-Id'],
    exposedHeaders: ['X-Trace-Id'],
  });
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/bootstrap/security/security.setup.ts
git commit -m "feat: add Helmet and CORS security setup"
```

---

## Task 10: Swagger 설정

**Files:**
- Create: `src/bootstrap/swagger/swagger.setup.ts`

- [ ] **Step 1: swagger.setup.ts 생성**

`src/bootstrap/swagger/swagger.setup.ts`:
```typescript
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

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
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/bootstrap/swagger/swagger.setup.ts
git commit -m "feat: add Swagger/OpenAPI setup"
```

---

## Task 11: Health Check 엔드포인트 (TDD e2e)

**Files:**
- Create: `src/modules/health/health.controller.ts`
- Create: `src/modules/health/health.module.ts`
- Create: `test/health.e2e-spec.ts`

- [ ] **Step 1: e2e 테스트 먼저 작성**

`test/health.e2e-spec.ts`:
```typescript
import { INestApplication, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/shared/presentation/filters/http-exception.filter';
import { TransformInterceptor } from '../src/shared/presentation/interceptors/transform.interceptor';

describe('HealthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env['NODE_ENV'] = 'test';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({
      type: VersioningType.HEADER,
      header: 'X-API-Version',
      defaultVersion: '1',
    });
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns 200 with success response', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({
          success: true,
          data: { status: 'ok' },
        });
      });
  });

  it('GET /health includes X-Trace-Id in response headers', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect((res) => {
        expect(res.headers['x-trace-id']).toBeDefined();
        expect(res.headers['x-trace-id']).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        );
      });
  });

  it('GET /health echoes back a custom X-Trace-Id header', () => {
    const customTrace = 'my-custom-trace-id-001';
    return request(app.getHttpServer())
      .get('/health')
      .set('X-Trace-Id', customTrace)
      .expect((res) => {
        expect(res.headers['x-trace-id']).toBe(customTrace);
      });
  });
});
```

- [ ] **Step 2: e2e 테스트가 실패하는지 확인**

```bash
bun run test:e2e
```

Expected: `Cannot find module '../src/app.module'`

- [ ] **Step 3: HealthController 생성**

`src/modules/health/health.controller.ts`:
```typescript
import { Controller, Get, Version } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @Version('1')
  @ApiOperation({ summary: '서버 상태 확인' })
  check(): { status: string } {
    return { status: 'ok' };
  }
}
```

- [ ] **Step 4: HealthModule 생성**

`src/modules/health/health.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
```

- [ ] **Step 5: 커밋**

```bash
git add src/modules/health/
git commit -m "feat: add HealthModule with GET /health endpoint"
```

---

## Task 12: AppModule + main.ts 조립

**Files:**
- Create: `src/app.module.ts`
- Create: `src/main.ts`

- [ ] **Step 1: app.module.ts 생성**

`src/app.module.ts`:
```typescript
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { pinoConfig } from './bootstrap/logging/pino.config';
import { TraceMiddleware } from './bootstrap/logging/trace.middleware';
import { validateEnv } from './bootstrap/validation/env.schema';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env['NODE_ENV'] ?? 'development'}`,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    LoggerModule.forRoot(pinoConfig),
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TraceMiddleware).forRoutes('*');
  }
}
```

- [ ] **Step 2: main.ts 생성**

`src/main.ts`:
```typescript
import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { setupSecurity } from './bootstrap/security/security.setup';
import { setupSwagger } from './bootstrap/swagger/swagger.setup';
import { validateEnv } from './bootstrap/validation/env.schema';
import { HttpExceptionFilter } from './shared/presentation/filters/http-exception.filter';
import { TransformInterceptor } from './shared/presentation/interceptors/transform.interceptor';

async function bootstrap(): Promise<void> {
  const env = validateEnv(process.env as Record<string, unknown>);

  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));

  app.enableVersioning({
    type: VersioningType.HEADER,
    header: 'X-API-Version',
    defaultVersion: '1',
  });

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  setupSecurity(app);

  if (env.NODE_ENV !== 'production') {
    setupSwagger(app);
  }

  await app.listen(env.PORT);
}

bootstrap();
```

- [ ] **Step 3: 커밋**

```bash
git add src/app.module.ts src/main.ts
git commit -m "feat: assemble AppModule and main.ts with all bootstrap modules"
```

---

## Task 13: 전체 테스트 실행 및 수용 기준 검증

- [ ] **Step 1: 유닛 테스트 전체 실행**

```bash
bun run test
```

Expected output:
```
PASS src/bootstrap/validation/env.schema.spec.ts
PASS src/bootstrap/logging/trace.middleware.spec.ts
PASS src/shared/presentation/interceptors/transform.interceptor.spec.ts
PASS src/shared/presentation/filters/http-exception.filter.spec.ts

Tests:       16 passed, 16 total
```
(env.schema 7 + trace.middleware 3 + transform.interceptor 3 + http-exception.filter 3)

- [ ] **Step 2: e2e 테스트 실행**

```bash
bun run test:e2e
```

Expected output:
```
PASS test/health.e2e-spec.ts
  HealthController (e2e)
    ✓ GET /health returns 200 with success response
    ✓ GET /health includes X-Trace-Id in response headers
    ✓ GET /health echoes back a custom X-Trace-Id header

Tests:       3 passed, 3 total
```

- [ ] **Step 3: Biome lint/format 검사**

```bash
bun run check
```

Expected: 오류 없음. 오류가 있으면 `bun run format`으로 자동 수정 후 재확인.

- [ ] **Step 4: 개발 서버 실행 및 수동 확인**

터미널 A:
```bash
bun run start:dev
```

Expected 로그:
```
[NestApplication] Nest application successfully started
```

터미널 B에서:
```bash
# Health check
curl http://localhost:3000/health
# Expected: {"success":true,"data":{"status":"ok"}}

# Trace ID 생성 확인
curl -v http://localhost:3000/health 2>&1 | grep -i x-trace-id
# Expected: X-Trace-Id: <uuid>

# 잘못된 환경변수 시 fail-fast 확인 (별도 터미널)
JWT_SECRET=short DATABASE_URL=test NODE_ENV=development bun run start:dev
# Expected: "Environment validation failed: JWT_SECRET: ..."
```

- [ ] **Step 5: Swagger UI 확인**

브라우저에서 `http://localhost:3000/docs` 접속.
- Bearer Auth 버튼 노출 확인
- `X-API-Version` 헤더 파라미터 노출 확인
- `GET /health` 엔드포인트 노출 확인

- [ ] **Step 6: 최종 커밋**

```bash
git add test/health.e2e-spec.ts
git commit -m "test: add e2e test for health endpoint and verify acceptance criteria"
```

---

## 수용 기준 체크리스트

- [ ] `bun run start:dev` 실행 시 Zod 검증 통과 후 앱 기동
- [ ] 잘못된 환경변수 시 앱 시작 즉시 실패 및 명확한 에러 메시지
- [ ] `GET /health` → `{ "success": true, "data": { "status": "ok" } }`
- [ ] `http://localhost:3000/docs` 에서 Swagger UI 접근 가능
- [ ] 모든 요청 로그에 `traceId` 포함
- [ ] `X-Trace-Id` 응답 헤더 반환 확인
- [ ] Biome lint/format 통과
- [ ] 유닛 테스트 전체 통과
- [ ] e2e 테스트 전체 통과
