# src/ 전체 한국어 주석 추가 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `src/` 하위 35개 파일 전체에 NestJS 입문자를 위한 한국어 주석을 추가한다.

**Architecture:** 파일 상단 JSDoc 블록(역할·NestJS 개념·수정 시점) + 클래스/함수 한 줄 요약 + 복잡한 로직 인라인 보조 주석(필요한 경우만). 로직 변경 없이 주석만 추가한다.

**Tech Stack:** TypeScript, NestJS 11, Drizzle ORM, ioredis, Zod, Biome(linter)

---

## 파일 구조 맵

| 파일 | 작업 |
|------|------|
| `src/main.ts` | 주석 추가 |
| `src/app.module.ts` | 주석 추가 |
| `src/app.controller.ts` | 주석 추가 |
| `src/app.service.ts` | 주석 추가 |
| `src/bootstrap/bootstrap-application.ts` | 주석 추가 |
| `src/bootstrap/config/app-config.module.ts` | 주석 추가 |
| `src/bootstrap/config/app-config.schema.ts` | 주석 추가 |
| `src/bootstrap/config/app-config.service.ts` | 주석 추가 |
| `src/bootstrap/config/load-app-config.ts` | 주석 추가 |
| `src/bootstrap/logging/trace-id.constants.ts` | 주석 추가 |
| `src/bootstrap/logging/trace-id.middleware.ts` | 주석 추가 |
| `src/bootstrap/logging/request-logger.middleware.ts` | 주석 추가 |
| `src/bootstrap/security/setup-security.ts` | 주석 추가 |
| `src/bootstrap/swagger/setup-swagger.ts` | 주석 추가 |
| `src/bootstrap/validation/setup-validation.ts` | 주석 추가 |
| `src/modules/health/health.controller.ts` | 주석 추가 |
| `src/modules/health/health.service.ts` | 주석 추가 |
| `src/modules/health/health.module.ts` | 주석 추가 |
| `src/shared/infrastructure/cache/cache.constants.ts` | 주석 추가 |
| `src/shared/infrastructure/cache/cache.service.ts` | 주석 추가 |
| `src/shared/infrastructure/cache/cache-health.service.ts` | 주석 추가 |
| `src/shared/infrastructure/cache/cache-example.service.ts` | 주석 추가 |
| `src/shared/infrastructure/cache/cache.module.ts` | 주석 추가 |
| `src/shared/infrastructure/database/database.constants.ts` | 주석 추가 |
| `src/shared/infrastructure/database/database.types.ts` | 주석 추가 |
| `src/shared/infrastructure/database/create-database-client.ts` | 주석 추가 |
| `src/shared/infrastructure/database/database-health.service.ts` | 주석 추가 |
| `src/shared/infrastructure/database/database.module.ts` | 주석 추가 |
| `src/shared/infrastructure/database/database.service.ts` | 주석 추가 |
| `src/shared/infrastructure/request-context.ts` | 주석 추가 |
| `src/shared/infrastructure/request-context.spec.ts` | 주석 추가 |
| `src/shared/presentation/api-response.ts` | 주석 추가 |
| `src/shared/presentation/global-exception.filter.ts` | 주석 추가 |
| `src/types/better-sqlite3.d.ts` | 주석 추가 |

---

## Task 1: src/ 진입점 파일 4개

**Files:**
- Modify: `src/main.ts`
- Modify: `src/app.module.ts`
- Modify: `src/app.controller.ts`
- Modify: `src/app.service.ts`

- [ ] **Step 1: `src/main.ts` 주석 추가**

```typescript
/**
 * 애플리케이션 진입점(entry point).
 *
 * NestJS 앱은 여기서 시작됩니다. `NestFactory.create(AppModule)`로
 * 앱 인스턴스를 생성하고, 미들웨어·보안·Swagger 등 초기 설정을 마친 뒤
 * 지정된 포트에서 HTTP 요청을 수신합니다.
 *
 * 포트 등 설정값은 환경변수에서 읽어오며, `AppConfigService`를 통해 접근합니다.
 * 서버 시작 포트를 바꾸려면 `.env`의 `PORT` 값을 수정하세요.
 */
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { bootstrapApplication } from './bootstrap/bootstrap-application';
import { AppConfigService } from './bootstrap/config/app-config.service';

async function main() {
  const app = await NestFactory.create(AppModule);

  await bootstrapApplication(app);

  const appConfigService = app.get(AppConfigService);
  await app.listen(appConfigService.port);
}

void main();
```

- [ ] **Step 2: `src/app.module.ts` 주석 추가**

```typescript
/**
 * 애플리케이션 루트 모듈.
 *
 * NestJS는 모듈 단위로 기능을 조립합니다. 이 파일은 최상위 모듈로,
 * 모든 하위 모듈을 한 곳에서 연결하는 역할을 합니다.
 *
 * `ThrottlerModule`은 동일 IP에서 분당 60회를 초과하는 요청을 자동으로 차단합니다.
 * `APP_GUARD`로 `ThrottlerGuard`를 등록하면 모든 라우터에 자동 적용됩니다.
 * 속도 제한 설정을 바꾸려면 `throttlers` 배열의 `ttl`·`limit` 값을 수정하세요.
 */
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule, seconds } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './bootstrap/config/app-config.module';
import { HealthModule } from './modules/health/health.module';
import { CacheModule } from './shared/infrastructure/cache/cache.module';
import { DatabaseModule } from './shared/infrastructure/database/database.module';

@Module({
  imports: [
    AppConfigModule,
    CacheModule,
    DatabaseModule,
    HealthModule,
    // 분당 60회 초과 요청을 차단하는 속도 제한 모듈
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: seconds(60),
          limit: 60,
        },
      ],
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      // ThrottlerGuard를 전역 가드로 등록해 모든 엔드포인트에 속도 제한을 적용합니다.
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

- [ ] **Step 3: `src/app.controller.ts` 주석 추가**

```typescript
/**
 * 루트 경로(`GET /api/v1`) 컨트롤러.
 *
 * NestJS에서 `@Controller()`는 HTTP 요청을 받아 서비스로 위임하는 역할을 합니다.
 * 이 컨트롤러는 앱의 기본 상태(이름·버전·환경)를 반환하는 단순한 엔드포인트입니다.
 * 새로운 루트 경로 엔드포인트가 필요할 때 이 파일을 수정하세요.
 */
import { Controller, Get, Version } from '@nestjs/common';

import { AppService } from './app.service';
import { createApiResponse } from './shared/presentation/api-response';

/** `GET /api/v1` 요청을 처리하는 루트 컨트롤러 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /** 앱 이름·버전·실행 환경을 반환합니다. */
  @Get()
  @Version('1')
  getRoot() {
    return createApiResponse(this.appService.getFoundationStatus(), {
      traceId: this.appService.getCurrentTraceId(),
    });
  }
}
```

- [ ] **Step 4: `src/app.service.ts` 주석 추가**

```typescript
/**
 * 루트 경로의 비즈니스 로직을 담당하는 서비스.
 *
 * NestJS에서 `@Injectable()` 서비스는 컨트롤러에서 비즈니스 로직을 분리하는 단위입니다.
 * 이 서비스는 환경변수에서 앱 메타데이터를 읽어 반환하고,
 * 현재 요청의 traceId를 가져오는 두 가지 역할을 합니다.
 */
import { Injectable } from '@nestjs/common';

import { AppConfigService } from './bootstrap/config/app-config.service';
import { getTraceId } from './shared/infrastructure/request-context';

/** 루트 엔드포인트가 반환하는 앱 상태 정보의 타입 */
export interface FoundationStatus {
  environment: string;
  name: string;
  version: string;
}

/** 앱 기본 상태 정보를 제공하는 서비스 */
@Injectable()
export class AppService {
  constructor(private readonly appConfigService: AppConfigService) {}

  /** 환경변수에서 앱 이름·버전·실행 환경을 읽어 반환합니다. */
  getFoundationStatus(): FoundationStatus {
    return {
      name: this.appConfigService.appName,
      version: this.appConfigService.appVersion,
      environment: this.appConfigService.nodeEnv,
    };
  }

  /** AsyncLocalStorage에서 현재 요청의 traceId를 가져옵니다. */
  getCurrentTraceId() {
    return getTraceId();
  }
}
```

- [ ] **Step 5: 린트 검사**

```bash
cd /Users/gyuha/workspace/nestjs-bootstrap && bun run lint
```

오류가 없으면 다음 단계로 진행합니다.

- [ ] **Step 6: 커밋**

```bash
git add src/main.ts src/app.module.ts src/app.controller.ts src/app.service.ts
git commit -m "docs: src/ 진입점 파일 4개 한국어 주석 추가"
```

---

## Task 2: bootstrap/config 설정 파일 5개

**Files:**
- Modify: `src/bootstrap/config/app-config.module.ts`
- Modify: `src/bootstrap/config/app-config.schema.ts`
- Modify: `src/bootstrap/config/app-config.service.ts`
- Modify: `src/bootstrap/config/load-app-config.ts`

- [ ] **Step 1: `src/bootstrap/config/app-config.module.ts` 주석 추가**

```typescript
/**
 * 환경변수 설정을 전역으로 제공하는 모듈.
 *
 * `@Global()` 데코레이터 덕분에 이 모듈을 `AppModule`에 한 번만 등록하면
 * 프로젝트 어디서든 `AppConfigService`를 주입받아 사용할 수 있습니다.
 * `ConfigModule.forRoot()`의 `cache: true`는 환경변수를 파싱 후 메모리에 캐싱해
 * 반복 접근 시 성능을 높입니다.
 * 새로운 환경변수를 추가하려면 `app-config.schema.ts`와 `app-config.service.ts`도 함께 수정하세요.
 */
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppConfigService } from './app-config.service';
import { loadAppConfig } from './load-app-config';

/** 전역 설정 모듈 — AppModule에 한 번만 등록하면 전체 앱에서 사용 가능 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [loadAppConfig],
      // ${VAR} 형태로 다른 환경변수를 참조할 수 있게 합니다.
      expandVariables: true,
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
```

- [ ] **Step 2: `src/bootstrap/config/app-config.schema.ts` 주석 추가**

```typescript
/**
 * 환경변수 유효성 검증 스키마 (Zod).
 *
 * 앱 시작 시 `process.env`를 이 스키마로 파싱합니다. 필수값이 빠지거나 형식이 틀리면
 * 즉시 오류를 발생시켜 잘못된 설정으로 앱이 실행되는 것을 막습니다.
 * `superRefine`을 사용해 DB 드라이버 선택에 따른 조건부 필수 필드를 검증합니다.
 *
 * 새로운 환경변수를 추가하려면 이 스키마의 `z.object()` 안에 필드를 추가하세요.
 */
import { z } from 'zod';

/** 빈 문자열("")을 undefined로 변환하는 전처리 함수 — 선택적 환경변수에 사용 */
const emptyStringToUndefined = (value: unknown) =>
  typeof value === 'string' && value.length === 0 ? undefined : value;

/** 빈 문자열을 허용하지 않는 선택적 문자열 타입 */
const optionalNonEmptyString = z.preprocess(
  emptyStringToUndefined,
  z.string().min(1).optional(),
);

/** 빈 문자열을 허용하지 않는 선택적 양의 정수 타입 */
const optionalPositiveInt = z.preprocess(
  emptyStringToUndefined,
  z.coerce.number().int().positive().optional(),
);

/** 전체 환경변수 유효성 검증 스키마 */
export const appConfigSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    APP_NAME: z.string().min(1),
    APP_DESCRIPTION: z.string().min(1),
    APP_VERSION: z.string().min(1),
    APP_CORS_ORIGIN: z.string().min(1),
    DB_DRIVER: z.enum(['postgres', 'sqlite']),
    DATABASE_URL: z.string().default(''),
    POSTGRES_HOST: optionalNonEmptyString,
    POSTGRES_PORT: optionalPositiveInt,
    POSTGRES_USER: optionalNonEmptyString,
    POSTGRES_PASSWORD: z.string().default(''),
    POSTGRES_DB: optionalNonEmptyString,
    SQLITE_PATH: z.string().default(''),
    DATABASE_MIGRATIONS_DIR: z.string().default(''),
    REDIS_HOST: z.string().min(1),
    REDIS_PORT: z.coerce.number().int().positive(),
    REDIS_PASSWORD: z.string(),
    REDIS_DB: z.coerce.number().int().min(0),
    REDIS_KEY_PREFIX: z.string(),
    HEALTH_CACHE_KEY: z.string().min(1),
  })
  .superRefine((config, context) => {
    // sqlite 드라이버 선택 시: SQLITE_PATH 또는 file: 접두사가 붙은 DATABASE_URL 필요
    if (config.DB_DRIVER === 'sqlite') {
      const hasSqlitePath = config.SQLITE_PATH.length > 0;
      const hasDatabaseUrl = config.DATABASE_URL.length > 0;
      const hasSqliteDatabaseUrl = config.DATABASE_URL.startsWith('file:');

      if (hasDatabaseUrl && !hasSqliteDatabaseUrl) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'DATABASE_URL must use the file: scheme when DB_DRIVER=sqlite',
          path: ['DATABASE_URL'],
        });
      }

      if (!hasSqlitePath && !hasSqliteDatabaseUrl) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'SQLITE_PATH or a sqlite DATABASE_URL is required when DB_DRIVER=sqlite',
          path: hasSqlitePath ? ['SQLITE_PATH'] : ['DATABASE_URL'],
        });
      }

      return;
    }

    // postgres 드라이버 선택 시: DATABASE_URL 또는 개별 접속 정보(host·port·user·db) 필요
    if (config.DATABASE_URL.length > 0) {
      return;
    }

    const missingPostgresTupleFields = [
      ['POSTGRES_HOST', config.POSTGRES_HOST],
      ['POSTGRES_PORT', config.POSTGRES_PORT],
      ['POSTGRES_USER', config.POSTGRES_USER],
      ['POSTGRES_DB', config.POSTGRES_DB],
    ] as const;

    for (const [field, value] of missingPostgresTupleFields) {
      if (value === undefined || value === '') {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${field} is required when DB_DRIVER=postgres and DATABASE_URL is blank`,
          path: [field],
        });
      }
    }
  });

/** 검증된 환경변수 객체의 TypeScript 타입 */
export type AppConfig = z.infer<typeof appConfigSchema>;
```

- [ ] **Step 3: `src/bootstrap/config/app-config.service.ts` 주석 추가**

```typescript
/**
 * 환경변수에 타입 안전하게 접근하는 서비스.
 *
 * NestJS `ConfigService`를 직접 사용하면 키를 문자열로 지정해야 해서 오타 위험이 있습니다.
 * 이 서비스는 `ConfigService`를 래핑해 각 환경변수를 타입이 명시된 getter로 노출합니다.
 * 새로운 환경변수를 앱에서 사용하려면 이 파일에 getter를 추가하세요.
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AppConfig } from './app-config.schema';

/** 환경변수를 타입 안전한 getter로 제공하는 서비스 */
@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService<AppConfig, true>) {}

  get nodeEnv() {
    return this.configService.get('NODE_ENV', { infer: true });
  }

  get port() {
    return this.configService.get('PORT', { infer: true });
  }

  get appName() {
    return this.configService.get('APP_NAME', { infer: true });
  }

  get appDescription() {
    return this.configService.get('APP_DESCRIPTION', { infer: true });
  }

  get appVersion() {
    return this.configService.get('APP_VERSION', { infer: true });
  }

  get appCorsOrigin() {
    return this.configService.get('APP_CORS_ORIGIN', { infer: true });
  }

  get databaseDriver() {
    return this.configService.get('DB_DRIVER', { infer: true });
  }

  get databaseUrl() {
    return this.configService.get('DATABASE_URL', { infer: true });
  }

  get postgresHost() {
    return this.configService.get('POSTGRES_HOST', { infer: true });
  }

  get postgresPort() {
    return this.configService.get('POSTGRES_PORT', { infer: true });
  }

  get postgresUser() {
    return this.configService.get('POSTGRES_USER', { infer: true });
  }

  get postgresPassword() {
    return this.configService.get('POSTGRES_PASSWORD', { infer: true });
  }

  get postgresDb() {
    return this.configService.get('POSTGRES_DB', { infer: true });
  }

  get sqlitePath() {
    return this.configService.get('SQLITE_PATH', { infer: true });
  }

  get databaseMigrationsDir() {
    return this.configService.get('DATABASE_MIGRATIONS_DIR', { infer: true });
  }

  get redisHost() {
    return this.configService.get('REDIS_HOST', { infer: true });
  }

  get redisPort() {
    return this.configService.get('REDIS_PORT', { infer: true });
  }

  get redisPassword() {
    return this.configService.get('REDIS_PASSWORD', { infer: true });
  }

  get redisDb() {
    return this.configService.get('REDIS_DB', { infer: true });
  }

  get redisKeyPrefix() {
    return this.configService.get('REDIS_KEY_PREFIX', { infer: true });
  }

  get healthCacheKey() {
    return this.configService.get('HEALTH_CACHE_KEY', { infer: true });
  }
}
```

- [ ] **Step 4: `src/bootstrap/config/load-app-config.ts` 주석 추가**

```typescript
/**
 * 환경변수를 읽어 Zod 스키마로 파싱하는 함수.
 *
 * `ConfigModule.forRoot({ load: [loadAppConfig] })`에 전달되어 앱 시작 시 한 번 실행됩니다.
 * 파싱에 실패하면 에러를 던져 앱 실행을 즉시 중단시킵니다.
 * 이 동작 덕분에 잘못된 환경변수 설정으로 앱이 반쯤 실행되는 상황을 막을 수 있습니다.
 */
import { appConfigSchema } from './app-config.schema';

/** `process.env`를 파싱해 검증된 설정 객체를 반환합니다. 검증 실패 시 예외를 발생시킵니다. */
export const loadAppConfig = () => {
  const parsed = appConfigSchema.safeParse(process.env);

  if (!parsed.success) {
    throw new Error(
      `Invalid environment configuration: ${parsed.error.message}`,
    );
  }

  return parsed.data;
};
```

- [ ] **Step 5: 린트 검사**

```bash
cd /Users/gyuha/workspace/nestjs-bootstrap && bun run lint
```

- [ ] **Step 6: 커밋**

```bash
git add src/bootstrap/config/
git commit -m "docs: bootstrap/config 설정 파일 한국어 주석 추가"
```

---

## Task 3: bootstrap/logging 파일 3개 + bootstrap-application.ts

**Files:**
- Modify: `src/bootstrap/logging/trace-id.constants.ts`
- Modify: `src/bootstrap/logging/trace-id.middleware.ts`
- Modify: `src/bootstrap/logging/request-logger.middleware.ts`
- Modify: `src/bootstrap/bootstrap-application.ts`

- [ ] **Step 1: `src/bootstrap/logging/trace-id.constants.ts` 주석 추가**

```typescript
/**
 * 요청 추적 ID(traceId)에 사용하는 HTTP 헤더명 상수.
 *
 * 문자열을 직접 사용하면 여러 파일에서 오타가 발생할 수 있습니다.
 * 상수로 분리하면 IDE 자동완성을 활용할 수 있고, 헤더명 변경 시 이 파일만 수정하면 됩니다.
 */

/** 요청·응답에 traceId를 전달하는 HTTP 헤더명 */
export const TRACE_ID_HEADER = 'x-trace-id';
```

- [ ] **Step 2: `src/bootstrap/logging/trace-id.middleware.ts` 주석 추가**

```typescript
/**
 * 모든 HTTP 요청에 traceId를 부여하는 미들웨어.
 *
 * NestJS 미들웨어는 요청이 컨트롤러에 도달하기 전에 실행되는 함수입니다.
 * 이 미들웨어는 요청 헤더에 `x-trace-id`가 있으면 재사용하고, 없으면 UUID를 새로 생성합니다.
 * traceId는 요청 객체와 응답 헤더에 저장되고, `AsyncLocalStorage`를 통해
 * 비동기 실행 흐름 전체에서 접근할 수 있습니다.
 * 요청 추적 방식을 바꾸려면 `resolveTraceId` 메서드를 수정하세요.
 */
import { randomUUID } from 'node:crypto';

import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Response } from 'express';

import {
  type RequestWithTraceId,
  runWithRequestContext,
} from '../../shared/infrastructure/request-context';
import { TRACE_ID_HEADER } from './trace-id.constants';

/** 요청마다 traceId를 생성하거나 헤더에서 가져와 request 객체와 AsyncLocalStorage에 주입합니다. */
@Injectable()
export class TraceIdMiddleware implements NestMiddleware {
  use(request: RequestWithTraceId, response: Response, next: NextFunction) {
    const traceId = this.resolveTraceId(request.headers[TRACE_ID_HEADER]);

    request.traceId = traceId;
    response.setHeader(TRACE_ID_HEADER, traceId);

    // AsyncLocalStorage에 traceId를 담아 이후 모든 비동기 코드에서 접근 가능하게 합니다.
    runWithRequestContext({ traceId }, next);
  }

  /** 헤더값에서 traceId를 추출합니다. 헤더가 없거나 비어있으면 새 UUID를 생성합니다. */
  private resolveTraceId(headerValue: string | string[] | undefined) {
    if (typeof headerValue === 'string' && headerValue.length > 0) {
      return headerValue;
    }

    if (Array.isArray(headerValue) && headerValue[0]) {
      return headerValue[0];
    }

    return randomUUID();
  }
}
```

- [ ] **Step 3: `src/bootstrap/logging/request-logger.middleware.ts` 주석 추가**

```typescript
/**
 * HTTP 요청 완료 시 메서드·경로·상태코드·소요시간·traceId를 JSON으로 기록하는 미들웨어.
 *
 * `response.on('finish')` 이벤트를 사용하는 이유:
 * 응답이 클라이언트에 완전히 전송된 뒤에 실행되므로 최종 상태코드와 소요시간을 정확히 기록할 수 있습니다.
 * NestJS Logger를 사용하므로 NestJS의 로그 레벨 설정(`LogLevel`)과 연동됩니다.
 * 로그 형식을 바꾸려면 `this.logger.log()` 호출 부분을 수정하세요.
 */
import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Response } from 'express';

import type { RequestWithTraceId } from '../../shared/infrastructure/request-context';

/** 요청 완료 시 접근 로그를 JSON 형태로 남기는 미들웨어 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggerMiddleware.name);

  use(request: RequestWithTraceId, response: Response, next: NextFunction) {
    const startedAt = Date.now();
    const { method } = request;
    const path = request.originalUrl || request.url;

    // 응답이 완전히 전송된 후에 로그를 기록해 정확한 상태코드와 소요시간을 얻습니다.
    response.on('finish', () => {
      const durationMs = Date.now() - startedAt;

      this.logger.log(
        JSON.stringify({
          method,
          path,
          statusCode: response.statusCode,
          durationMs,
          traceId: request.traceId,
        }),
      );
    });

    next();
  }
}
```

- [ ] **Step 4: `src/bootstrap/bootstrap-application.ts` 주석 추가**

```typescript
/**
 * NestJS 앱 인스턴스에 공통 설정을 적용하는 함수.
 *
 * `main.ts`에서 앱 생성 직후 호출됩니다. 실행 순서가 중요합니다:
 * 1. 미들웨어 등록 (traceId → 요청 로거 순)
 * 2. 글로벌 URL 프리픽스(`/api`) 설정
 * 3. 보안 헤더·CORS 설정
 * 4. 입력값 유효성 검사 파이프 등록
 * 5. URI 기반 API 버전 관리 활성화 (기본 v1)
 * 6. 전역 예외 필터 등록
 * 7. Swagger 문서 노출 (프로덕션 환경 제외)
 *
 * 새로운 전역 미들웨어·가드·인터셉터를 추가하려면 이 파일을 수정하세요.
 */
import { type INestApplication, VersioningType } from '@nestjs/common';

import { GlobalExceptionFilter } from '../shared/presentation/global-exception.filter';
import { AppConfigService } from './config/app-config.service';
import { RequestLoggerMiddleware } from './logging/request-logger.middleware';
import { TraceIdMiddleware } from './logging/trace-id.middleware';
import { setupSecurity } from './security/setup-security';
import { setupSwagger } from './swagger/setup-swagger';
import { setupValidation } from './validation/setup-validation';

/** NestJS 앱 인스턴스에 미들웨어·보안·검증·문서화 설정을 순서대로 적용합니다. */
export async function bootstrapApplication(app: INestApplication) {
  const appConfigService = app.get(AppConfigService);
  const traceIdMiddleware = new TraceIdMiddleware();
  const requestLoggerMiddleware = new RequestLoggerMiddleware();

  // traceId를 먼저 부여해야 이후 로거에서 traceId를 읽을 수 있습니다.
  app.use(traceIdMiddleware.use.bind(traceIdMiddleware));
  app.use(requestLoggerMiddleware.use.bind(requestLoggerMiddleware));
  app.setGlobalPrefix('api');
  setupSecurity(app);
  setupValidation(app);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger는 개발·스테이징 환경에서만 노출합니다.
  if (appConfigService.nodeEnv !== 'production') {
    setupSwagger(app);
  }
}
```

- [ ] **Step 5: 린트 검사**

```bash
cd /Users/gyuha/workspace/nestjs-bootstrap && bun run lint
```

- [ ] **Step 6: 커밋**

```bash
git add src/bootstrap/logging/ src/bootstrap/bootstrap-application.ts
git commit -m "docs: bootstrap/logging 및 bootstrap-application 한국어 주석 추가"
```

---

## Task 4: bootstrap/security, swagger, validation 파일 3개

**Files:**
- Modify: `src/bootstrap/security/setup-security.ts`
- Modify: `src/bootstrap/swagger/setup-swagger.ts`
- Modify: `src/bootstrap/validation/setup-validation.ts`

- [ ] **Step 1: `src/bootstrap/security/setup-security.ts` 주석 추가**

```typescript
/**
 * HTTP 보안 헤더와 CORS를 설정하는 함수.
 *
 * `helmet`은 XSS·클릭재킹 등 일반적인 웹 공격을 막는 보안 헤더를 자동으로 추가합니다.
 * CORS 설정은 허용된 출처(`APP_CORS_ORIGIN`)에서 온 요청만 브라우저가 허용하도록 합니다.
 * `exposedHeaders`에 `x-trace-id`를 추가해 브라우저 클라이언트에서도 traceId를 읽을 수 있습니다.
 * 허용 출처를 변경하려면 `.env`의 `APP_CORS_ORIGIN` 값을 수정하세요.
 */
import type { INestApplication } from '@nestjs/common';
import helmet from 'helmet';

import { AppConfigService } from '../config/app-config.service';
import { TRACE_ID_HEADER } from '../logging/trace-id.constants';

/** Helmet 보안 헤더와 CORS를 앱에 적용합니다. */
export function setupSecurity(app: INestApplication) {
  const appConfigService = app.get(AppConfigService);

  app.use(
    helmet({
      // 이미지·폰트 등 크로스 오리진 리소스 로드를 허용합니다.
      crossOriginResourcePolicy: false,
    }),
  );

  app.enableCors({
    credentials: true,
    // 브라우저 JavaScript에서 이 헤더를 읽을 수 있도록 노출합니다.
    exposedHeaders: [TRACE_ID_HEADER],
    origin: appConfigService.appCorsOrigin,
  });
}
```

- [ ] **Step 2: `src/bootstrap/swagger/setup-swagger.ts` 주석 추가**

```typescript
/**
 * Swagger API 문서를 설정하고 `/api/docs` 경로에 노출하는 함수.
 *
 * `@nestjs/swagger`는 컨트롤러·DTO의 데코레이터를 분석해 OpenAPI 문서를 자동 생성합니다.
 * 문서 제목·설명·버전은 환경변수에서 읽어옵니다.
 * JSON 형식의 스펙은 `/api/docs/json`에서 확인할 수 있습니다.
 * 이 함수는 프로덕션 환경에서는 호출되지 않습니다(`bootstrap-application.ts` 참고).
 */
import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppConfigService } from '../config/app-config.service';

/** Swagger 문서를 생성하고 `/api/docs` 경로에 마운트합니다. */
export function setupSwagger(app: INestApplication) {
  const appConfigService = app.get(AppConfigService);

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle(appConfigService.appName)
      .setDescription(appConfigService.appDescription)
      .setVersion(appConfigService.appVersion)
      .build(),
  );

  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs/json',
    // 글로벌 프리픽스(`/api`)를 포함한 경로로 문서를 생성합니다.
    useGlobalPrefix: true,
  });
}
```

- [ ] **Step 3: `src/bootstrap/validation/setup-validation.ts` 주석 추가**

```typescript
/**
 * class-validator 기반 전역 입력값 유효성 검사 파이프를 등록하는 함수.
 *
 * `ValidationPipe`는 DTO 클래스에 붙은 `@IsString()`, `@IsEmail()` 등의 데코레이터를
 * 기반으로 요청 바디·쿼리·파라미터를 자동으로 검증합니다.
 * - `whitelist: true`: DTO에 정의되지 않은 필드는 자동으로 제거합니다.
 * - `forbidNonWhitelisted: true`: 허용되지 않은 필드가 있으면 400 오류를 반환합니다.
 * - `transform: true`: 문자열로 들어온 값을 DTO의 타입에 맞게 자동 변환합니다.
 */
import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';

/** 전역 ValidationPipe를 등록해 모든 엔드포인트에 입력값 검증을 적용합니다. */
export function setupValidation(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
}
```

- [ ] **Step 4: 린트 검사**

```bash
cd /Users/gyuha/workspace/nestjs-bootstrap && bun run lint
```

- [ ] **Step 5: 커밋**

```bash
git add src/bootstrap/security/ src/bootstrap/swagger/ src/bootstrap/validation/
git commit -m "docs: bootstrap security·swagger·validation 한국어 주석 추가"
```

---

## Task 5: modules/health 파일 3개

**Files:**
- Modify: `src/modules/health/health.controller.ts`
- Modify: `src/modules/health/health.service.ts`
- Modify: `src/modules/health/health.module.ts`

- [ ] **Step 1: `src/modules/health/health.controller.ts` 주석 추가**

```typescript
/**
 * 시스템 헬스체크 엔드포인트 컨트롤러.
 *
 * 두 개의 엔드포인트를 제공합니다:
 * - `GET /api/v1/health`: 앱이 살아있는지 확인하는 단순 응답 (Liveness probe)
 * - `GET /api/v1/health/details`: DB·Redis 연결 상태를 함께 확인 (Readiness probe)
 *
 * 쿠버네티스나 도커 헬스체크에서 이 엔드포인트를 사용할 수 있습니다.
 * 하나라도 비정상이면 `503 Service Unavailable`을 반환합니다.
 */
import {
  Controller,
  Get,
  ServiceUnavailableException,
  Version,
} from '@nestjs/common';

import { getTraceId } from '../../shared/infrastructure/request-context';
import { createApiResponse } from '../../shared/presentation/api-response';

import { HealthService } from './health.service';

/** `/api/v1/health` 경로의 헬스체크 요청을 처리하는 컨트롤러 */
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /** 앱 프로세스가 정상 실행 중임을 확인하는 단순 응답을 반환합니다. */
  @Get()
  @Version('1')
  getHealth() {
    return createApiResponse(
      { status: 'ok' },
      {
        traceId: getTraceId(),
      },
    );
  }

  /** DB·Redis 연결 상태를 확인하고, 하나라도 비정상이면 503을 반환합니다. */
  @Get('details')
  @Version('1')
  async getDetails() {
    const details = await this.healthService.getDetails();

    if (Object.values(details).some((isHealthy) => !isHealthy)) {
      throw new ServiceUnavailableException('Readiness check failed');
    }

    return createApiResponse(details, {
      traceId: getTraceId(),
    });
  }
}
```

- [ ] **Step 2: `src/modules/health/health.service.ts` 주석 추가**

```typescript
/**
 * DB·Redis 연결 상태를 집계해 전체 시스템 헬스를 판단하는 서비스.
 *
 * 각 인프라 헬스 서비스에 ping을 보내고 결과를 모아 반환합니다.
 * `Promise.all`로 병렬 실행해 전체 체크 시간을 최소화합니다.
 * 새로운 헬스체크 항목(예: 외부 API)을 추가하려면 `HealthDetails` 인터페이스와
 * `getDetails` 메서드를 함께 수정하세요.
 */
import { Injectable } from '@nestjs/common';

import { CacheHealthService } from '../../shared/infrastructure/cache/cache-health.service';
import { DatabaseHealthService } from '../../shared/infrastructure/database/database-health.service';

/** 헬스체크 결과의 타입 — 각 항목이 정상이면 true */
export interface HealthDetails {
  cache: boolean;
  database: boolean;
}

/** 캐시(Redis)와 데이터베이스의 헬스 상태를 병렬로 확인하는 서비스 */
@Injectable()
export class HealthService {
  constructor(
    private readonly cacheHealthService: CacheHealthService,
    private readonly databaseHealthService: DatabaseHealthService,
  ) {}

  /** 모든 인프라 컴포넌트의 헬스 상태를 병렬로 확인해 결과를 반환합니다. */
  async getDetails(): Promise<HealthDetails> {
    const [cache, database] = await Promise.all([
      this.cacheHealthService.isHealthy(),
      this.databaseHealthService.isHealthy(),
    ]);

    return { cache, database };
  }
}
```

- [ ] **Step 3: `src/modules/health/health.module.ts` 주석 추가**

```typescript
/**
 * 헬스체크 기능을 하나의 모듈로 묶는 NestJS 모듈.
 *
 * `CacheModule`과 `DatabaseModule`을 import해 Redis·DB 헬스 서비스를 사용합니다.
 * NestJS의 모듈 시스템 덕분에 의존성이 명시적으로 선언되며,
 * 이 모듈을 import하면 헬스체크에 필요한 모든 의존성이 자동으로 주입됩니다.
 */
import { Module } from '@nestjs/common';

import { CacheModule } from '../../shared/infrastructure/cache/cache.module';
import { DatabaseModule } from '../../shared/infrastructure/database/database.module';

import { HealthController } from './health.controller';
import { HealthService } from './health.service';

/** 헬스체크 컨트롤러·서비스 및 인프라 모듈 의존성을 조립하는 모듈 */
@Module({
  imports: [CacheModule, DatabaseModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
```

- [ ] **Step 4: 린트 검사**

```bash
cd /Users/gyuha/workspace/nestjs-bootstrap && bun run lint
```

- [ ] **Step 5: 커밋**

```bash
git add src/modules/health/
git commit -m "docs: modules/health 헬스체크 파일 한국어 주석 추가"
```

---

## Task 6: shared/infrastructure/cache 파일 5개

**Files:**
- Modify: `src/shared/infrastructure/cache/cache.constants.ts`
- Modify: `src/shared/infrastructure/cache/cache.service.ts`
- Modify: `src/shared/infrastructure/cache/cache-health.service.ts`
- Modify: `src/shared/infrastructure/cache/cache-example.service.ts`
- Modify: `src/shared/infrastructure/cache/cache.module.ts`

- [ ] **Step 1: `src/shared/infrastructure/cache/cache.constants.ts` 주석 추가**

```typescript
/**
 * Redis 캐시 관련 상수 모음.
 *
 * `CACHE_HEALTH_RESPONSE`: Redis의 PING 명령에 대한 정상 응답값입니다.
 * `CACHE_LAZY_CLIENT_OPTIONS`: 앱 시작 시 Redis에 즉시 연결하지 않고,
 * 첫 명령 실행 시 연결하는 지연 연결(lazy connect) 옵션입니다.
 * `enableOfflineQueue: false`는 Redis 연결이 끊어진 동안 명령을 큐에 쌓지 않고
 * 즉시 오류를 반환해 헬스체크가 빠르게 실패하도록 합니다.
 */

/** Redis PING 명령의 정상 응답 문자열 */
export const CACHE_HEALTH_RESPONSE = 'PONG';

/** ioredis 지연 연결 옵션 — 앱 시작 시 불필요한 연결 시도를 방지합니다 */
export const CACHE_LAZY_CLIENT_OPTIONS = {
  enableOfflineQueue: false,
  lazyConnect: true,
  maxRetriesPerRequest: 1,
} as const;
```

- [ ] **Step 2: `src/shared/infrastructure/cache/cache.service.ts` 주석 추가**

```typescript
/**
 * Redis 연결을 관리하는 서비스.
 *
 * ioredis 클라이언트를 초기화하고, 앱 종료 시 연결을 안전하게 닫습니다.
 * `lazyConnect: true` 옵션으로 첫 명령 실행 시에만 실제 연결을 맺습니다.
 * 다른 서비스에서 Redis를 사용하려면 이 서비스를 주입받아 `this.cacheService.client`로 접근하세요.
 * `onApplicationShutdown`은 NestJS 생명주기 훅으로, 앱 종료 신호를 받으면 자동 호출됩니다.
 */
import { Injectable, type OnApplicationShutdown } from '@nestjs/common';
import { Redis } from 'ioredis';

import { AppConfigService } from '../../../bootstrap/config/app-config.service';

import { CACHE_LAZY_CLIENT_OPTIONS } from './cache.constants';

/** Redis 클라이언트 초기화·ping·종료를 담당하는 서비스 */
@Injectable()
export class CacheService implements OnApplicationShutdown {
  readonly client;

  constructor(private readonly appConfigService: AppConfigService) {
    this.client = new Redis({
      host: appConfigService.redisHost,
      port: appConfigService.redisPort,
      password: appConfigService.redisPassword || undefined,
      db: appConfigService.redisDb,
      keyPrefix: appConfigService.redisKeyPrefix,
      ...CACHE_LAZY_CLIENT_OPTIONS,
    });
  }

  /** keyPrefix가 포함된 완전한 Redis 키 문자열을 반환합니다. */
  buildKey(key: string) {
    const keyPrefix = this.client.options.keyPrefix;

    return `${typeof keyPrefix === 'string' ? keyPrefix : ''}${key}`;
  }

  /** Redis에 PING 명령을 보내 연결 상태를 확인합니다. */
  async ping() {
    return this.client.ping();
  }

  /** 앱 종료 시 Redis 연결을 안전하게 닫습니다. 연결 상태에 따라 quit 또는 disconnect를 사용합니다. */
  async onApplicationShutdown() {
    if (this.client.status === 'end') {
      return;
    }

    // 아직 연결이 시작되지 않은 상태면 즉시 연결을 끊습니다.
    if (this.client.status === 'wait') {
      this.client.disconnect();

      return;
    }

    try {
      // 진행 중인 명령이 완료된 후 연결을 종료합니다.
      await this.client.quit();
    } catch {
      this.client.disconnect();
    }
  }
}
```

- [ ] **Step 3: `src/shared/infrastructure/cache/cache-health.service.ts` 주석 추가**

```typescript
/**
 * Redis 연결 상태를 확인하는 헬스체크 서비스.
 *
 * `CacheService.ping()`으로 PING 명령을 보내고 'PONG' 응답 여부로 정상 여부를 판단합니다.
 * 예외 발생 시(연결 실패, 타임아웃 등) false를 반환해 헬스체크가 실패 처리되도록 합니다.
 */
import { Injectable } from '@nestjs/common';

import { CACHE_HEALTH_RESPONSE } from './cache.constants';
import { CacheService } from './cache.service';

/** Redis ping 응답으로 캐시 연결 상태를 확인하는 서비스 */
@Injectable()
export class CacheHealthService {
  constructor(private readonly cacheService: CacheService) {}

  /** Redis가 'PONG'을 응답하면 true, 실패하거나 예외 발생 시 false를 반환합니다. */
  async isHealthy() {
    try {
      return (await this.cacheService.ping()) === CACHE_HEALTH_RESPONSE;
    } catch {
      return false;
    }
  }
}
```

- [ ] **Step 4: `src/shared/infrastructure/cache/cache-example.service.ts` 주석 추가**

```typescript
/**
 * Redis 키 생성 방법을 보여주는 예시 서비스.
 *
 * 이 서비스는 Redis 직접 연산 대신, `CacheService.buildKey()`를 활용해
 * keyPrefix가 포함된 완전한 Redis 키를 만드는 패턴을 보여줍니다.
 * 실제 비즈니스 로직에서 Redis를 사용할 때 이 패턴을 참고하세요.
 * 새로운 캐시 기능을 추가할 때는 이 파일을 복사·수정하거나 새 서비스를 만드세요.
 */
import { Injectable } from '@nestjs/common';

import { AppConfigService } from '../../../bootstrap/config/app-config.service';

import { CacheService } from './cache.service';

/** Redis 키 생성 패턴의 사용 예시를 보여주는 서비스 */
@Injectable()
export class CacheExampleService {
  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly cacheService: CacheService,
  ) {}

  /** 헬스체크용 Redis 키의 완전한 경로(keyPrefix 포함)를 반환합니다. */
  getHealthCacheKey() {
    return this.cacheService.buildKey(this.appConfigService.healthCacheKey);
  }
}
```

- [ ] **Step 5: `src/shared/infrastructure/cache/cache.module.ts` 주석 추가**

```typescript
/**
 * Redis 캐시 관련 서비스를 하나의 모듈로 묶는 NestJS 모듈.
 *
 * `CacheService`(연결 관리), `CacheHealthService`(헬스체크), `CacheExampleService`(사용 예시)를
 * 제공하고 외부 모듈에서 주입받을 수 있도록 exports합니다.
 * 다른 모듈에서 Redis 기능이 필요하면 `imports: [CacheModule]`을 추가하세요.
 */
import { Module } from '@nestjs/common';

import { AppConfigModule } from '../../../bootstrap/config/app-config.module';

import { CacheExampleService } from './cache-example.service';
import { CacheHealthService } from './cache-health.service';
import { CacheService } from './cache.service';

/** Redis 연결·헬스체크·사용 예시 서비스를 조립하고 외부에 공개하는 모듈 */
@Module({
  imports: [AppConfigModule],
  providers: [CacheService, CacheExampleService, CacheHealthService],
  exports: [CacheService, CacheExampleService, CacheHealthService],
})
export class CacheModule {}
```

- [ ] **Step 6: 린트 검사**

```bash
cd /Users/gyuha/workspace/nestjs-bootstrap && bun run lint
```

- [ ] **Step 7: 커밋**

```bash
git add src/shared/infrastructure/cache/
git commit -m "docs: shared/infrastructure/cache 한국어 주석 추가"
```

---

## Task 7: shared/infrastructure/database 파일 6개

**Files:**
- Modify: `src/shared/infrastructure/database/database.constants.ts`
- Modify: `src/shared/infrastructure/database/database.types.ts`
- Modify: `src/shared/infrastructure/database/create-database-client.ts`
- Modify: `src/shared/infrastructure/database/database-health.service.ts`
- Modify: `src/shared/infrastructure/database/database.module.ts`
- Modify: `src/shared/infrastructure/database/database.service.ts`

- [ ] **Step 1: `src/shared/infrastructure/database/database.constants.ts` 주석 추가**

```typescript
/**
 * 데이터베이스 관련 상수 모음.
 *
 * `DATABASE_DRIVERS`: 지원하는 DB 드라이버 목록. 환경변수 검증과 드라이버 분기에 사용됩니다.
 * `DEFAULT_DATABASE_URL`: SQLite 경로가 지정되지 않았을 때 사용하는 기본 파일 경로입니다.
 * `SQLITE_FILE_URL_PREFIX`: `file:./path.sqlite` 형태의 URL 접두사로, DATABASE_URL이
 * SQLite를 가리키는지 구분하는 데 사용됩니다.
 */

/** 지원하는 데이터베이스 드라이버 목록 */
export const DATABASE_DRIVERS = ['postgres', 'sqlite'] as const;

/** SQLite 경로 미지정 시 사용하는 기본 데이터베이스 파일 경로 */
export const DEFAULT_DATABASE_URL = './data/dev.sqlite';

/** DATABASE_URL에서 SQLite 파일 경로를 나타내는 URL 접두사 */
export const SQLITE_FILE_URL_PREFIX = 'file:';
```

- [ ] **Step 2: `src/shared/infrastructure/database/database.types.ts` 주석 추가**

```typescript
/**
 * 데이터베이스 클라이언트 관련 TypeScript 타입 정의.
 *
 * 이 프로젝트는 postgres와 sqlite 두 드라이버를 지원합니다.
 * `DatabaseClient` 유니온 타입을 통해 드라이버 종류에 따라 타입이 좁혀지므로
 * 컴파일 타임에 드라이버별 분기 처리를 안전하게 할 수 있습니다.
 * 새로운 DB 드라이버를 추가하려면 여기에 해당 클라이언트 인터페이스를 추가하세요.
 */
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Pool } from 'pg';

import type * as postgresSchema from '../../../../drizzle/schema/postgres';
import type * as sqliteSchema from '../../../../drizzle/schema/sqlite';

import type { DATABASE_DRIVERS } from './database.constants';

/** 지원 DB 드라이버의 리터럴 유니온 타입 ('postgres' | 'sqlite') */
export type DatabaseDriver = (typeof DATABASE_DRIVERS)[number];

/** `createDatabaseClient` 함수에 전달하는 옵션 타입 */
export interface CreateDatabaseClientOptions {
  databaseUrl: string;
  driver: DatabaseDriver;
  postgresDatabase?: string;
  postgresHost?: string;
  postgresPassword: string;
  postgresPort?: number;
  postgresUser?: string;
  sqlitePath: string;
}

/** better-sqlite3의 `prepare().get/all/run` 반환 타입 */
export interface SqliteStatement {
  all(...params: unknown[]): unknown[];
  get(...params: unknown[]): unknown;
  run(...params: unknown[]): {
    changes: number;
    lastInsertRowid: bigint | number;
  };
}

/** better-sqlite3 데이터베이스 클라이언트 인터페이스 */
export interface SqliteClient {
  readonly name: string;
  close(): SqliteClient;
  prepare(source: string): SqliteStatement;
}

/** SQLite 드라이버용 클라이언트 묶음 타입 */
export interface SqliteDatabaseClient {
  client: SqliteClient;
  db: BetterSQLite3Database<typeof sqliteSchema>;
  driver: 'sqlite';
}

/** PostgreSQL 드라이버용 클라이언트 묶음 타입 */
export interface PostgresDatabaseClient {
  client: Pool;
  db: NodePgDatabase<typeof postgresSchema>;
  driver: 'postgres';
}

/** postgres 또는 sqlite 클라이언트를 통합하는 유니온 타입 */
export type DatabaseClient = PostgresDatabaseClient | SqliteDatabaseClient;
```

- [ ] **Step 3: `src/shared/infrastructure/database/create-database-client.ts` 주석 추가**

```typescript
/**
 * 설정에 따라 postgres 또는 sqlite Drizzle ORM 클라이언트를 생성하는 팩토리 함수.
 *
 * `DB_DRIVER` 환경변수에 따라 분기하며, SQLite는 파일 기반이라 디렉터리가 없으면 자동 생성합니다.
 * postgres는 `DATABASE_URL`(Connection String) 또는 개별 접속 정보 중 하나를 사용합니다.
 * Drizzle ORM의 `db` 객체에는 스키마가 연결되어 타입 안전한 쿼리를 작성할 수 있습니다.
 * 새 DB 드라이버 지원이 필요하면 이 파일에 분기를 추가하고 `database.types.ts`에 타입을 정의하세요.
 */
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzlePostgres } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as postgresSchema from '../../../../drizzle/schema/postgres';
import * as sqliteSchema from '../../../../drizzle/schema/sqlite';

import {
  DEFAULT_DATABASE_URL,
  SQLITE_FILE_URL_PREFIX,
} from './database.constants';
import type {
  CreateDatabaseClientOptions,
  DatabaseClient,
  PostgresDatabaseClient,
  SqliteClient,
  SqliteDatabaseClient,
} from './database.types';

// better-sqlite3는 ESM/CJS 혼용 환경에서 require()로 로드해야 타입이 올바르게 적용됩니다.
const BetterSqlite3 = require('better-sqlite3') as {
  new (filename: string): SqliteClient;
};

/** `DATABASE_URL` 또는 `SQLITE_PATH`에서 실제 파일 경로를 결정합니다. */
function resolveSqlitePath({
  databaseUrl,
  sqlitePath,
}: Pick<CreateDatabaseClientOptions, 'databaseUrl' | 'sqlitePath'>) {
  if (databaseUrl.startsWith(SQLITE_FILE_URL_PREFIX)) {
    return databaseUrl.slice(SQLITE_FILE_URL_PREFIX.length);
  }

  if (databaseUrl.length > 0) {
    throw new Error('sqlite driver requires DATABASE_URL values to use file:');
  }

  if (sqlitePath.length > 0) {
    return sqlitePath;
  }

  return DEFAULT_DATABASE_URL;
}

/** SQLite 파일 경로를 확인하고, 부모 디렉터리가 없으면 생성한 후 클라이언트를 반환합니다. */
function createSqliteDatabaseClient(
  options: CreateDatabaseClientOptions,
): SqliteDatabaseClient {
  const sqlitePath = resolveSqlitePath(options);

  // SQLite 파일의 부모 디렉터리가 없으면 자동으로 생성합니다.
  mkdirSync(dirname(sqlitePath), { recursive: true });

  const client = new BetterSqlite3(sqlitePath);

  return {
    client,
    db: drizzleSqlite(client, { schema: sqliteSchema }),
    driver: 'sqlite',
  };
}

/** CONNECTION_STRING 또는 개별 접속 정보로 PostgreSQL 커넥션 풀을 생성합니다. */
function createPostgresDatabaseClient(
  options: CreateDatabaseClientOptions,
): PostgresDatabaseClient {
  // DATABASE_URL이 있고 sqlite URL이 아니면 Connection String으로 연결합니다.
  const connectionString =
    options.databaseUrl.length > 0 &&
    !options.databaseUrl.startsWith(SQLITE_FILE_URL_PREFIX)
      ? options.databaseUrl
      : undefined;

  const client = connectionString
    ? new Pool({ connectionString })
    : new Pool({
        database: options.postgresDatabase,
        host: options.postgresHost,
        password: options.postgresPassword,
        port: options.postgresPort,
        user: options.postgresUser,
      });

  return {
    client,
    db: drizzlePostgres(client, { schema: postgresSchema }),
    driver: 'postgres',
  };
}

/** DB 드라이버 설정에 따라 sqlite 또는 postgres Drizzle 클라이언트를 생성합니다. */
export function createDatabaseClient(
  options: CreateDatabaseClientOptions,
): DatabaseClient {
  if (options.driver === 'sqlite') {
    return createSqliteDatabaseClient(options);
  }

  return createPostgresDatabaseClient(options);
}
```

- [ ] **Step 4: `src/shared/infrastructure/database/database-health.service.ts` 주석 추가**

```typescript
/**
 * 데이터베이스 연결 상태를 확인하는 헬스체크 서비스.
 *
 * `DatabaseService.ping()`을 호출해 DB가 응답하는지 확인합니다.
 * 예외 발생 시(연결 실패, 타임아웃 등) false를 반환해 헬스체크가 실패 처리되도록 합니다.
 */
import { Injectable } from '@nestjs/common';

import { DatabaseService } from './database.service';

/** DB ping으로 데이터베이스 연결 상태를 확인하는 서비스 */
@Injectable()
export class DatabaseHealthService {
  constructor(private readonly databaseService: DatabaseService) {}

  /** DB가 SELECT 1에 응답하면 true, 실패하거나 예외 발생 시 false를 반환합니다. */
  async isHealthy() {
    try {
      return await this.databaseService.ping();
    } catch {
      return false;
    }
  }
}
```

- [ ] **Step 5: `src/shared/infrastructure/database/database.module.ts` 주석 추가**

```typescript
/**
 * 데이터베이스 관련 서비스를 하나의 모듈로 묶는 NestJS 모듈.
 *
 * `DatabaseService`(연결 관리)와 `DatabaseHealthService`(헬스체크)를
 * 제공하고 외부 모듈에서 주입받을 수 있도록 exports합니다.
 * DB를 사용하는 다른 모듈에서 `imports: [DatabaseModule]`을 추가하면
 * DatabaseService를 바로 주입받을 수 있습니다.
 */
import { Module } from '@nestjs/common';

import { AppConfigModule } from '../../../bootstrap/config/app-config.module';

import { DatabaseHealthService } from './database-health.service';
import { DatabaseService } from './database.service';

/** DB 연결·헬스체크 서비스를 조립하고 외부에 공개하는 모듈 */
@Module({
  imports: [AppConfigModule],
  providers: [DatabaseService, DatabaseHealthService],
  exports: [DatabaseService, DatabaseHealthService],
})
export class DatabaseModule {}
```

- [ ] **Step 6: `src/shared/infrastructure/database/database.service.ts` 주석 추가**

```typescript
/**
 * 데이터베이스 연결을 관리하는 서비스.
 *
 * 앱 시작 시 `createDatabaseClient()`를 호출해 postgres 또는 sqlite 클라이언트를 초기화합니다.
 * `db` getter로 Drizzle ORM 인스턴스에 접근해 타입 안전한 쿼리를 작성할 수 있습니다.
 * `onApplicationShutdown`은 NestJS 생명주기 훅으로, 앱 종료 시 자동으로 DB 연결을 닫습니다.
 * DB 쿼리를 실행하려면 이 서비스를 주입받아 `this.databaseService.db`를 사용하세요.
 */
import { Injectable, type OnApplicationShutdown } from '@nestjs/common';

import { AppConfigService } from '../../../bootstrap/config/app-config.service';

import { createDatabaseClient } from './create-database-client';

/** DB 클라이언트 초기화·ping·종료를 담당하는 서비스 */
@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  readonly databaseClient;

  constructor(private readonly appConfigService: AppConfigService) {
    this.databaseClient = createDatabaseClient({
      databaseUrl: appConfigService.databaseUrl,
      driver: appConfigService.databaseDriver,
      postgresDatabase: appConfigService.postgresDb,
      postgresHost: appConfigService.postgresHost,
      postgresPassword: appConfigService.postgresPassword,
      postgresPort: appConfigService.postgresPort,
      postgresUser: appConfigService.postgresUser,
      sqlitePath: appConfigService.sqlitePath,
    });
  }

  /** 로우 레벨 DB 클라이언트(pg Pool 또는 better-sqlite3 Database)를 반환합니다. */
  get client() {
    return this.databaseClient.client;
  }

  /** Drizzle ORM 인스턴스를 반환합니다. 타입 안전한 쿼리 작성에 사용하세요. */
  get db() {
    return this.databaseClient.db;
  }

  /** 현재 사용 중인 DB 드라이버 이름('postgres' | 'sqlite')을 반환합니다. */
  get driver() {
    return this.databaseClient.driver;
  }

  /** `SELECT 1` 쿼리로 DB 연결이 살아있는지 확인합니다. */
  async ping() {
    if (this.databaseClient.driver === 'sqlite') {
      this.databaseClient.client.prepare('SELECT 1').get();

      return true;
    }

    await this.databaseClient.client.query('SELECT 1');

    return true;
  }

  /** 앱 종료 시 드라이버에 따라 적절한 방식으로 DB 연결을 닫습니다. */
  async onApplicationShutdown() {
    if (this.databaseClient.driver === 'sqlite') {
      this.databaseClient.client.close();

      return;
    }

    await this.databaseClient.client.end();
  }
}
```

- [ ] **Step 7: 린트 검사**

```bash
cd /Users/gyuha/workspace/nestjs-bootstrap && bun run lint
```

- [ ] **Step 8: 커밋**

```bash
git add src/shared/infrastructure/database/
git commit -m "docs: shared/infrastructure/database 한국어 주석 추가"
```

---

## Task 8: shared/infrastructure/request-context 파일 2개

**Files:**
- Modify: `src/shared/infrastructure/request-context.ts`
- Modify: `src/shared/infrastructure/request-context.spec.ts`

- [ ] **Step 1: `src/shared/infrastructure/request-context.ts` 주석 추가**

```typescript
/**
 * 비동기 실행 흐름 전체에서 요청 컨텍스트(traceId)를 공유하는 유틸리티.
 *
 * Node.js의 `AsyncLocalStorage`를 사용하면 콜백·Promise·async-await 체인을 거쳐도
 * 같은 요청에서 시작된 코드라면 동일한 컨텍스트 데이터에 접근할 수 있습니다.
 * `TraceIdMiddleware`가 요청 시작 시 `runWithRequestContext`를 호출해 컨텍스트를 설정하고,
 * 이후 어디서든 `getTraceId()`로 해당 요청의 traceId를 꺼낼 수 있습니다.
 */
import { AsyncLocalStorage } from 'node:async_hooks';

import type { Request } from 'express';

/** 요청당 저장되는 컨텍스트 데이터의 타입 */
export interface RequestContext {
  traceId: string;
}

/** Express Request에 traceId 필드를 추가한 확장 타입 */
export interface RequestWithTraceId extends Request {
  traceId: string;
}

// 요청별 컨텍스트를 비동기 경계를 넘어 전달하는 AsyncLocalStorage 인스턴스
const requestContextStorage = new AsyncLocalStorage<RequestContext>();

/** 주어진 컨텍스트를 활성화한 상태로 콜백을 실행합니다. 미들웨어에서 호출합니다. */
export function runWithRequestContext<T>(
  context: RequestContext,
  callback: () => T,
) {
  return requestContextStorage.run(context, callback);
}

/** 현재 비동기 실행 흐름에 연결된 요청 컨텍스트 전체를 반환합니다. */
export function getRequestContext() {
  return requestContextStorage.getStore();
}

/** 현재 요청의 traceId를 반환합니다. 요청 컨텍스트 외부에서 호출하면 undefined를 반환합니다. */
export function getTraceId() {
  return getRequestContext()?.traceId;
}
```

- [ ] **Step 2: `src/shared/infrastructure/request-context.spec.ts` 주석 추가**

```typescript
/**
 * request-context의 AsyncLocalStorage 동작을 검증하는 단위 테스트.
 *
 * 두 가지 핵심 속성을 테스트합니다:
 * 1. async/await 경계를 넘어도 같은 컨텍스트의 traceId가 유지되는가
 * 2. 동시에 실행되는 여러 컨텍스트가 서로 간섭하지 않는가 (격리성)
 */
import { getTraceId, runWithRequestContext } from './request-context';

describe('request-context', () => {
  it('preserves the trace id across async boundaries', async () => {
    await runWithRequestContext({ traceId: 'trace-123' }, async () => {
      await Promise.resolve();

      expect(getTraceId()).toBe('trace-123');
    });
  });

  it('isolates overlapping async contexts', async () => {
    const results = await Promise.all([
      runWithRequestContext({ traceId: 'trace-a' }, async () => {
        // 15ms 대기해 두 컨텍스트가 시간적으로 겹치도록 만듭니다.
        await new Promise((resolve) => setTimeout(resolve, 15));

        return getTraceId();
      }),
      runWithRequestContext({ traceId: 'trace-b' }, async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));

        return getTraceId();
      }),
    ]);

    expect(results).toEqual(['trace-a', 'trace-b']);
    // 컨텍스트 바깥에서는 undefined를 반환해야 합니다.
    expect(getTraceId()).toBeUndefined();
  });
});
```

- [ ] **Step 3: 린트 검사**

```bash
cd /Users/gyuha/workspace/nestjs-bootstrap && bun run lint
```

- [ ] **Step 4: 커밋**

```bash
git add src/shared/infrastructure/request-context.ts src/shared/infrastructure/request-context.spec.ts
git commit -m "docs: shared/infrastructure/request-context 한국어 주석 추가"
```

---

## Task 9: shared/presentation 파일 2개 + types 파일 1개

**Files:**
- Modify: `src/shared/presentation/api-response.ts`
- Modify: `src/shared/presentation/global-exception.filter.ts`
- Modify: `src/types/better-sqlite3.d.ts`

- [ ] **Step 1: `src/shared/presentation/api-response.ts` 주석 추가**

```typescript
/**
 * API 성공 응답을 일관된 형태로 감싸는 헬퍼 함수.
 *
 * 모든 엔드포인트가 `{ success: true, data: ..., meta: { traceId: ... } }` 형태로
 * 응답하도록 통일합니다. 클라이언트는 `success` 필드로 성공/실패를 판단할 수 있습니다.
 * 실패 응답은 `GlobalExceptionFilter`에서 동일한 구조로 처리됩니다.
 */

/** 성공 응답 데이터를 `{ success, data, meta }` 형태로 감쌉니다. */
export const createApiResponse = <TData>(
  data: TData,
  meta?: { traceId?: string },
) => ({
  success: true,
  data,
  meta,
});
```

- [ ] **Step 2: `src/shared/presentation/global-exception.filter.ts` 주석 추가**

```typescript
/**
 * 앱 전체에서 발생하는 예외를 잡아 일관된 오류 응답으로 변환하는 필터.
 *
 * NestJS `ExceptionFilter`는 컨트롤러·서비스에서 던져진 예외를 가로채
 * HTTP 응답으로 변환합니다. `@Catch()` 데코레이터에 타입을 지정하지 않으면
 * 모든 예외를 잡습니다.
 *
 * 응답 형태: `{ success: false, error: string, meta: { traceId: string } }`
 * - `HttpException`이면 해당 상태코드를 사용합니다.
 * - 그 외 예외는 500 Internal Server Error로 처리합니다.
 * - traceId는 request 객체 또는 응답 헤더에서 가져옵니다.
 */
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

import { TRACE_ID_HEADER } from '../../bootstrap/logging/trace-id.constants';
import type { RequestWithTraceId } from '../infrastructure/request-context';

/** 모든 예외를 잡아 `{ success: false, error, meta }` 형태로 응답하는 전역 예외 필터 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<RequestWithTraceId>();
    const response = context.getResponse<Response>();

    // HttpException이면 해당 상태코드 사용, 그 외 예외는 500으로 처리합니다.
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // TraceIdMiddleware가 실행되지 않은 경우를 대비해 헤더에서도 traceId를 시도합니다.
    const traceId =
      request.traceId || String(response.getHeader(TRACE_ID_HEADER) || '');

    response.status(statusCode).json({
      success: false,
      error: this.getErrorMessage(exception),
      meta: { traceId },
    });
  }

  /** 예외 유형에 따라 클라이언트에게 노출할 오류 메시지를 추출합니다. */
  private getErrorMessage(exception: unknown) {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return response;
      }

      if (
        typeof response === 'object' &&
        response !== null &&
        'message' in response
      ) {
        return response.message;
      }
    }

    // 알 수 없는 예외는 내부 구현을 노출하지 않고 일반 메시지를 반환합니다.
    return 'Internal server error';
  }
}
```

- [ ] **Step 3: `src/types/better-sqlite3.d.ts` 주석 추가**

```typescript
/**
 * better-sqlite3 모듈의 TypeScript 타입 선언 보강(augmentation) 파일.
 *
 * better-sqlite3는 자체 타입 선언이 이 프로젝트의 사용 패턴과 맞지 않아
 * 별도로 타입을 정의합니다. `declare module`로 해당 패키지의 타입을
 * 덮어쓰거나 보강할 수 있습니다.
 * 이 파일은 런타임에는 존재하지 않으며, TypeScript 컴파일 단계에서만 사용됩니다.
 */
declare module 'better-sqlite3' {
  export interface Options {
    fileMustExist?: boolean;
    nativeBinding?: string;
    readonly?: boolean;
    timeout?: number;
    verbose?: (...args: unknown[]) => void;
  }

  export interface RunResult {
    changes: number;
    lastInsertRowid: bigint | number;
  }

  export interface Statement {
    all(...params: unknown[]): unknown[];
    get(...params: unknown[]): unknown;
    run(...params: unknown[]): RunResult;
  }

  interface Database {
    readonly name: string;
    readonly open: boolean;
    close(): Database;
    prepare(source: string): Statement;
  }

  interface DatabaseConstructor {
    new (filename: string, options?: Options): Database;
  }

  const Database: DatabaseConstructor;

  export default Database;
}
```

- [ ] **Step 4: 린트 검사**

```bash
cd /Users/gyuha/workspace/nestjs-bootstrap && bun run lint
```

- [ ] **Step 5: 커밋**

```bash
git add src/shared/presentation/ src/types/
git commit -m "docs: shared/presentation 및 types 한국어 주석 추가"
```

---

## Task 10: 빌드 최종 검증

- [ ] **Step 1: 전체 빌드 실행**

```bash
cd /Users/gyuha/workspace/nestjs-bootstrap && bun run build
```

빌드가 성공하면 모든 주석 추가가 올바르게 완료된 것입니다.

- [ ] **Step 2: 테스트 실행**

```bash
cd /Users/gyuha/workspace/nestjs-bootstrap && bun run test
```

- [ ] **Step 3: 최종 상태 확인**

```bash
git log --oneline -10
```

Task 1~9의 커밋이 모두 존재하는지 확인합니다.
