# Phase 2 Data & Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** NestJS DDD Bootstrap 프로젝트에 Drizzle ORM 기반 DB 연결, 환경별 캐시 모듈, Seeder/Factory 체계, Docker Compose, 확장된 Healthcheck를 구성한다.

**Architecture:** Docker Compose(postgres+redis) → DatabaseModule(Drizzle, 환경별 SQLite/PostgreSQL 자동 선택) → CacheModule(환경별 인메모리/Redis 자동 선택) → BaseFactory/Seeder 체계 → Health 확장 순으로 진행한다. 개발 환경은 Docker 없이 SQLite + 인메모리 캐시로 완전히 동작한다.

**Tech Stack:** Drizzle ORM, better-sqlite3 (dev), postgres.js (prod), @nestjs/cache-manager, cache-manager-ioredis-yet (prod), drizzle-kit, Jest, supertest

---

## 파일 구조 맵

새로 생성되는 파일:

```
docker-compose.yml
drizzle.config.ts

src/shared/infrastructure/database/
├── database.token.ts
├── database.provider.ts
├── database.module.ts
├── seed.ts
└── factories/
    └── base.factory.ts

src/shared/infrastructure/cache/
├── cache.module.ts
└── cache.service.ts

src/modules/health/
├── health.service.ts               ← 신규
├── health.controller.ts            ← 수정
└── health.module.ts                ← 수정
```

수정되는 파일:

```
package.json                        ← db:* scripts, 패키지 추가
src/app.module.ts                   ← DatabaseModule, CacheModule 추가
.env.development                    ← REDIS_URL 추가 (선택)
.env.production                     ← POSTGRES_USER, POSTGRES_PASSWORD 추가
```

테스트 파일:

```
src/shared/infrastructure/cache/cache.service.spec.ts
src/modules/health/health.service.spec.ts
test/health.e2e-spec.ts             ← 수정 (DB+Cache 필드 검증 추가)
```

---

## Task 1: 패키지 설치 및 Docker Compose 생성

**Files:**
- Modify: `package.json`
- Create: `docker-compose.yml`
- Create: `drizzle.config.ts`

- [ ] **Step 1: 패키지 설치**

```bash
bun add drizzle-orm better-sqlite3 postgres @nestjs/cache-manager cache-manager
bun add -d drizzle-kit @types/better-sqlite3 cache-manager-ioredis-yet
```

- [ ] **Step 2: package.json scripts 추가**

`package.json`의 `"scripts"` 안에 다음을 추가:

```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:studio": "drizzle-kit studio",
"db:seed": "bun run src/shared/infrastructure/database/seed.ts"
```

- [ ] **Step 3: docker-compose.yml 생성**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: nestjs_bootstrap
      POSTGRES_USER: ${POSTGRES_USER:-app}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-secret}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-app}"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

- [ ] **Step 4: drizzle.config.ts 생성**

```typescript
import type { Config } from 'drizzle-kit';

const isProduction = process.env['NODE_ENV'] === 'production';

export default {
  dialect: isProduction ? 'postgresql' : 'sqlite',
  schema: './src/modules/**/infrastructure/schema.ts',
  out: './src/shared/infrastructure/database/migrations',
  dbCredentials: isProduction
    ? { url: process.env['DATABASE_URL'] as string }
    : { url: process.env['DATABASE_URL'] ?? 'file:./dev.db' },
} satisfies Config;
```

- [ ] **Step 5: .env.production 업데이트**

`.env.production`에 추가:
```
POSTGRES_USER=app
POSTGRES_PASSWORD=secret
```

- [ ] **Step 6: 커밋**

```bash
git add package.json docker-compose.yml drizzle.config.ts .env.production
git commit -m "chore: add Drizzle ORM, cache-manager packages and Docker Compose"
```

---

## Task 2: Database DI 토큰 및 Provider

**Files:**
- Create: `src/shared/infrastructure/database/database.token.ts`
- Create: `src/shared/infrastructure/database/database.provider.ts`

- [ ] **Step 1: DI 토큰 생성**

`src/shared/infrastructure/database/database.token.ts`:

```typescript
export const DRIZZLE_CLIENT = 'DRIZZLE_CLIENT';
```

- [ ] **Step 2: database.provider.ts 생성**

`src/shared/infrastructure/database/database.provider.ts`:

```typescript
import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DRIZZLE_CLIENT } from './database.token';

export const DatabaseProvider: Provider = {
  provide: DRIZZLE_CLIENT,
  useFactory: async (config: ConfigService) => {
    const url = config.getOrThrow<string>('DATABASE_URL');

    if (config.get<string>('NODE_ENV') === 'production') {
      const { drizzle } = await import('drizzle-orm/postgres-js');
      const { default: postgres } = await import('postgres');
      return drizzle(postgres(url));
    }

    const { drizzle } = await import('drizzle-orm/better-sqlite3');
    const { default: Database } = await import('better-sqlite3');
    return drizzle(new Database(url));
  },
  inject: [ConfigService],
};
```

- [ ] **Step 3: 커밋**

```bash
git add src/shared/infrastructure/database/database.token.ts \
        src/shared/infrastructure/database/database.provider.ts
git commit -m "feat: add Drizzle ORM DI token and environment-aware provider"
```

---

## Task 3: DatabaseModule (마이그레이션 자동 실행 포함)

**Files:**
- Create: `src/shared/infrastructure/database/database.module.ts`
- Modify: `src/app.module.ts`

- [ ] **Step 1: database.module.ts 생성**

`src/shared/infrastructure/database/database.module.ts`:

```typescript
import { type OnModuleInit, Module, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseProvider } from './database.provider';
import { DRIZZLE_CLIENT } from './database.token';

@Module({
  providers: [DatabaseProvider],
  exports: [DatabaseProvider],
})
export class DatabaseModule implements OnModuleInit {
  private readonly logger = new Logger(DatabaseModule.name);

  constructor(
    private readonly config: ConfigService,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Inject(DRIZZLE_CLIENT) private readonly db: any,
  ) {}

  async onModuleInit(): Promise<void> {
    const env = this.config.get<string>('NODE_ENV');
    if (env !== 'production') {
      try {
        const { migrate } = await import('drizzle-orm/better-sqlite3/migrator');
        await migrate(this.db, {
          migrationsFolder:
            './src/shared/infrastructure/database/migrations',
        });
        this.logger.log('SQLite migrations applied');
      } catch {
        this.logger.warn('No migrations to apply or migrations folder missing');
      }
    }
  }
}
```

**Note:** `Inject` decorator를 추가해야 한다. 파일 상단 import에 `Inject` 포함:

```typescript
import { type OnModuleInit, Inject, Module, Logger } from '@nestjs/common';
```

- [ ] **Step 2: app.module.ts에 DatabaseModule 추가**

`src/app.module.ts`의 imports 배열에 `DatabaseModule` 추가:

```typescript
import { DatabaseModule } from './shared/infrastructure/database/database.module';

// @Module imports 배열:
imports: [
  ConfigModule.forRoot({ ... }),
  ThrottlerModule.forRoot([...]),
  LoggerModule.forRoot(pinoConfig),
  DatabaseModule,   // ← 추가
  HealthModule,
],
```

- [ ] **Step 3: bun run start:dev 실행하여 기동 확인**

```bash
bun run start:dev
```

Expected: 앱이 정상 기동되고 "SQLite migrations applied" 또는 "No migrations to apply" 로그 출력.

- [ ] **Step 4: 커밋**

```bash
git add src/shared/infrastructure/database/database.module.ts src/app.module.ts
git commit -m "feat: add DatabaseModule with auto-migration for development"
```

---

## Task 4: 빈 마이그레이션 폴더 및 시더 기본 체계

**Files:**
- Create: `src/shared/infrastructure/database/migrations/.gitkeep`
- Create: `src/shared/infrastructure/database/seed.ts`
- Create: `src/shared/infrastructure/database/factories/base.factory.ts`

- [ ] **Step 1: migrations 폴더 생성**

```bash
mkdir -p src/shared/infrastructure/database/migrations
touch src/shared/infrastructure/database/migrations/.gitkeep
```

- [ ] **Step 2: base.factory.ts 생성**

`src/shared/infrastructure/database/factories/base.factory.ts`:

```typescript
export abstract class BaseFactory<T> {
  abstract build(overrides?: Partial<T>): T;

  buildMany(count: number, overrides?: Partial<T>): T[] {
    return Array.from({ length: count }, () => this.build(overrides));
  }
}
```

- [ ] **Step 3: seed.ts 생성**

`src/shared/infrastructure/database/seed.ts`:

```typescript
async function seed(): Promise<void> {
  console.log('Starting seed...');
  // Phase 3~4에서 각 도메인 시더 추가
  console.log('Seeding complete');
}

seed().catch((err: unknown) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

- [ ] **Step 4: bun run db:seed 실행 확인**

```bash
bun run db:seed
```

Expected output:
```
Starting seed...
Seeding complete
```

- [ ] **Step 5: 커밋**

```bash
git add src/shared/infrastructure/database/
git commit -m "feat: add BaseFactory, seed entry point, and migrations folder"
```

---

## Task 5: CacheService (TDD)

**Files:**
- Create: `src/shared/infrastructure/cache/cache.service.ts`
- Create: `src/shared/infrastructure/cache/cache.service.spec.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/shared/infrastructure/cache/cache.service.spec.ts`:

```typescript
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test } from '@nestjs/testing';
import type { Cache } from 'cache-manager';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;
  let mockCache: jest.Mocked<Pick<Cache, 'get' | 'set' | 'del'>>;

  beforeEach(async () => {
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        CacheService,
        { provide: CACHE_MANAGER, useValue: mockCache },
      ],
    }).compile();

    service = module.get(CacheService);
  });

  it('get() returns cached value when key exists', async () => {
    mockCache.get.mockResolvedValue({ id: 1 });
    const result = await service.get<{ id: number }>('key');
    expect(result).toEqual({ id: 1 });
    expect(mockCache.get).toHaveBeenCalledWith('key');
  });

  it('get() returns null when key does not exist', async () => {
    mockCache.get.mockResolvedValue(undefined);
    const result = await service.get('missing-key');
    expect(result).toBeNull();
  });

  it('set() stores value with default ttl', async () => {
    mockCache.set.mockResolvedValue(undefined);
    await service.set('key', { id: 1 });
    expect(mockCache.set).toHaveBeenCalledWith('key', { id: 1 }, undefined);
  });

  it('set() stores value with custom ttl', async () => {
    mockCache.set.mockResolvedValue(undefined);
    await service.set('key', 'value', 300);
    expect(mockCache.set).toHaveBeenCalledWith('key', 'value', 300);
  });

  it('del() removes the key', async () => {
    mockCache.del.mockResolvedValue(undefined);
    await service.del('key');
    expect(mockCache.del).toHaveBeenCalledWith('key');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
bun run test --testPathPattern=cache.service
```

Expected: `Cannot find module './cache.service'`

- [ ] **Step 3: CacheService 구현**

`src/shared/infrastructure/cache/cache.service.ts`:

```typescript
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.cacheManager.get<T>(key);
    return value ?? null;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
bun run test --testPathPattern=cache.service
```

Expected: `PASS` (5 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/shared/infrastructure/cache/cache.service.ts \
        src/shared/infrastructure/cache/cache.service.spec.ts
git commit -m "feat: add CacheService wrapper with get/set/del"
```

---

## Task 6: CacheModule 생성 및 AppModule 연결

**Files:**
- Create: `src/shared/infrastructure/cache/cache.module.ts`
- Modify: `src/app.module.ts`

- [ ] **Step 1: cache.module.ts 생성**

`src/shared/infrastructure/cache/cache.module.ts`:

```typescript
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      useFactory: async (config: ConfigService) => {
        if (config.get<string>('NODE_ENV') === 'production') {
          const { redisStore } = await import('cache-manager-ioredis-yet');
          return {
            store: redisStore,
            url: config.getOrThrow<string>('REDIS_URL'),
            ttl: 60,
          };
        }
        return { ttl: 60 };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class AppCacheModule {}
```

- [ ] **Step 2: app.module.ts에 AppCacheModule 추가**

`src/app.module.ts`의 imports에 추가:

```typescript
import { AppCacheModule } from './shared/infrastructure/cache/cache.module';

// imports 배열:
imports: [
  ConfigModule.forRoot({ ... }),
  ThrottlerModule.forRoot([...]),
  LoggerModule.forRoot(pinoConfig),
  DatabaseModule,
  AppCacheModule,   // ← 추가
  HealthModule,
],
```

- [ ] **Step 3: 앱 기동 확인**

```bash
bun run start:dev
```

Expected: 정상 기동. "Nest application successfully started" 출력.

- [ ] **Step 4: 커밋**

```bash
git add src/shared/infrastructure/cache/cache.module.ts src/app.module.ts
git commit -m "feat: add CacheModule with environment-aware memory/Redis strategy"
```

---

## Task 7: HealthService (TDD) — DB + Cache 상태 체크

**Files:**
- Create: `src/modules/health/health.service.ts`
- Create: `src/modules/health/health.service.spec.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/modules/health/health.service.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { DRIZZLE_CLIENT } from '../../shared/infrastructure/database/database.token';
import { CacheService } from '../../shared/infrastructure/cache/cache.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let mockDb: { run: jest.Mock };
  let mockCache: jest.Mocked<Pick<CacheService, 'set' | 'get' | 'del'>>;

  beforeEach(async () => {
    mockDb = { run: jest.fn() };
    mockCache = {
      set: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue('1'),
      del: jest.fn().mockResolvedValue(undefined),
    };

    const module = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: DRIZZLE_CLIENT, useValue: mockDb },
        { provide: CacheService, useValue: mockCache },
      ],
    }).compile();

    service = module.get(HealthService);
  });

  describe('checkDb()', () => {
    it('returns "ok" when DB query succeeds', async () => {
      mockDb.run.mockReturnValue(undefined);
      const result = await service.checkDb();
      expect(result).toBe('ok');
    });

    it('returns "error" when DB query throws', async () => {
      mockDb.run.mockImplementation(() => {
        throw new Error('connection refused');
      });
      const result = await service.checkDb();
      expect(result).toBe('error');
    });
  });

  describe('checkCache()', () => {
    it('returns "ok" when cache set/get/del succeeds', async () => {
      const result = await service.checkCache();
      expect(result).toBe('ok');
      expect(mockCache.set).toHaveBeenCalled();
      expect(mockCache.get).toHaveBeenCalled();
      expect(mockCache.del).toHaveBeenCalled();
    });

    it('returns "error" when cache set throws', async () => {
      mockCache.set.mockRejectedValue(new Error('redis down'));
      const result = await service.checkCache();
      expect(result).toBe('error');
    });
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
bun run test --testPathPattern=health.service
```

Expected: `Cannot find module './health.service'`

- [ ] **Step 3: HealthService 구현**

`src/modules/health/health.service.ts`:

```typescript
import { Inject, Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { CacheService } from '../../shared/infrastructure/cache/cache.service';
import { DRIZZLE_CLIENT } from '../../shared/infrastructure/database/database.token';

type HealthStatus = 'ok' | 'error';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: { run: (query: unknown) => unknown },
    private readonly cacheService: CacheService,
  ) {}

  async checkDb(): Promise<HealthStatus> {
    try {
      this.db.run(sql`SELECT 1`);
      return 'ok';
    } catch (err) {
      this.logger.error('DB health check failed', err);
      return 'error';
    }
  }

  async checkCache(): Promise<HealthStatus> {
    const key = '__health_check__';
    try {
      await this.cacheService.set(key, '1', 5);
      await this.cacheService.get(key);
      await this.cacheService.del(key);
      return 'ok';
    } catch (err) {
      this.logger.error('Cache health check failed', err);
      return 'error';
    }
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
bun run test --testPathPattern=health.service
```

Expected: `PASS` (4 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/modules/health/health.service.ts \
        src/modules/health/health.service.spec.ts
git commit -m "feat: add HealthService with DB and cache connectivity checks"
```

---

## Task 8: HealthController 확장 + HealthModule 업데이트

**Files:**
- Modify: `src/modules/health/health.controller.ts`
- Modify: `src/modules/health/health.module.ts`

- [ ] **Step 1: health.module.ts 수정**

`src/modules/health/health.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { AppCacheModule } from '../../shared/infrastructure/cache/cache.module';
import { DatabaseModule } from '../../shared/infrastructure/database/database.module';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [DatabaseModule, AppCacheModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
```

- [ ] **Step 2: health.controller.ts 수정**

`src/modules/health/health.controller.ts`:

```typescript
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  VERSION_NEUTRAL,
  Version,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { HealthService } from './health.service';

interface HealthResult {
  status: 'ok' | 'degraded';
  db: 'ok' | 'error';
  cache: 'ok' | 'error';
}

@ApiTags('health')
@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  // VERSION_NEUTRAL: health check must be reachable regardless of X-API-Version header value
  @Version(VERSION_NEUTRAL)
  @ApiOperation({ summary: '서버 상태 확인 (DB + Cache 포함)' })
  async check(): Promise<HealthResult> {
    const [db, cache] = await Promise.all([
      this.healthService.checkDb(),
      this.healthService.checkCache(),
    ]);
    const status = db === 'ok' && cache === 'ok' ? 'ok' : 'degraded';
    return { status, db, cache };
  }
}
```

**Note:** `@HttpCode(HttpStatus.SERVICE_UNAVAILABLE)` 는 degraded 시 503을 반환해야 하지만 NestJS decorator는 동적 상태코드를 지원하지 않는다. 대신 `@Res()` + `res.status()` 패턴을 사용한다. 아래와 같이 수정:

```typescript
import {
  Controller,
  Get,
  HttpStatus,
  Res,
  VERSION_NEUTRAL,
  Version,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { HealthService } from './health.service';

interface HealthResult {
  status: 'ok' | 'degraded';
  db: 'ok' | 'error';
  cache: 'ok' | 'error';
}

@ApiTags('health')
@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Version(VERSION_NEUTRAL)
  @ApiOperation({ summary: '서버 상태 확인 (DB + Cache 포함)' })
  async check(@Res({ passthrough: true }) res: Response): Promise<HealthResult> {
    const [db, cache] = await Promise.all([
      this.healthService.checkDb(),
      this.healthService.checkCache(),
    ]);
    const status = db === 'ok' && cache === 'ok' ? 'ok' : 'degraded';
    if (status === 'degraded') {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }
    return { status, db, cache };
  }
}
```

- [ ] **Step 3: 전체 유닛 테스트 확인**

```bash
bun run test
```

Expected: 모든 테스트 통과 (기존 20개 + 새 9개 = 29개 이상)

- [ ] **Step 4: 커밋**

```bash
git add src/modules/health/health.controller.ts \
        src/modules/health/health.module.ts
git commit -m "feat: extend HealthController with DB and cache status (503 on degraded)"
```

---

## Task 9: e2e 테스트 업데이트 + 전체 수용 기준 검증

**Files:**
- Modify: `test/health.e2e-spec.ts`

- [ ] **Step 1: health.e2e-spec.ts 수정**

`test/health.e2e-spec.ts`에서 기존 첫 번째 테스트를 수정:

```typescript
it('GET /health returns 200 with db and cache status', () => {
  return request(app.getHttpServer())
    .get('/health')
    .expect(200)
    .expect((res) => {
      expect(res.body).toEqual({
        success: true,
        data: {
          status: 'ok',
          db: 'ok',
          cache: 'ok',
        },
      });
    });
});
```

나머지 두 테스트(X-Trace-Id 관련)는 그대로 유지.

- [ ] **Step 2: e2e 테스트 실행**

```bash
NODE_ENV=test bun run test:e2e
```

Expected:
```
PASS test/health.e2e-spec.ts
  HealthController (e2e)
    ✓ GET /health returns 200 with db and cache status
    ✓ GET /health includes X-Trace-Id in response headers
    ✓ GET /health echoes back a custom X-Trace-Id header
Tests: 3 passed
```

- [ ] **Step 3: 전체 유닛 테스트**

```bash
bun run test
```

Expected: 모든 테스트 통과

- [ ] **Step 4: Biome 검사**

```bash
bun run check
```

오류 발생 시:
```bash
bun run format
bun run check
```

- [ ] **Step 5: 개발 서버 기동 및 수동 확인**

터미널 A:
```bash
bun run start:dev
```

터미널 B:
```bash
# Health 체크 (DB + Cache 필드 확인)
curl http://localhost:3000/health
# Expected: {"success":true,"data":{"status":"ok","db":"ok","cache":"ok"}}

# bun run db:seed 실행 확인
bun run db:seed
# Expected: Starting seed... / Seeding complete
```

- [ ] **Step 6: Docker Compose 기동 확인**

```bash
docker compose up -d
docker compose ps
```

Expected: postgres, redis 모두 `healthy` 상태

- [ ] **Step 7: 최종 커밋**

```bash
git add test/health.e2e-spec.ts
git commit -m "test: update health e2e test to include db and cache status fields"
```

---

## 수용 기준 체크리스트

- [ ] `bun run start:dev` — Docker 없이 SQLite + 인메모리 캐시로 정상 기동
- [ ] `bun run db:seed` → `Starting seed... / Seeding complete`
- [ ] `GET /health` → `{ success: true, data: { status: 'ok', db: 'ok', cache: 'ok' } }`
- [ ] DB 연결 실패 시 `/health` 503 반환
- [ ] 캐시 연결 실패 시 `/health` 503 반환
- [ ] `docker compose up -d` — postgres + redis `healthy`
- [ ] 유닛 테스트 전체 통과
- [ ] e2e 테스트 전체 통과
- [ ] Biome lint/format 통과
