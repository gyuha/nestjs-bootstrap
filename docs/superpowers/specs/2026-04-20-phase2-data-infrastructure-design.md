# Phase 2 Data & Infrastructure — 설계 문서

- **날짜**: 2026-04-20
- **범위**: Phase 2 (Data and Infrastructure)
- **상태**: 승인됨

## 1. 개요

Phase 1에서 구성한 NestJS Foundation 위에 데이터 접근 계층과 캐시 인프라를 구성한다. Drizzle ORM 기반 DB 연결, Repository abstraction, Redis/인메모리 캐시 모듈, Seeder/Factory 체계, Docker Compose, Healthcheck 확장을 포함한다.

## 2. 환경별 인프라 전략

| 항목 | Development | Test | Production |
|------|-------------|------|------------|
| Database | SQLite (`file:./dev.db`) | SQLite (`:memory:`) | PostgreSQL |
| Cache | NestJS 인메모리 캐시 | NestJS 인메모리 캐시 | Redis |
| Docker | 불필요 | 불필요 | postgres + redis |
| Migration | 앱 시작 시 자동 | 앱 시작 시 자동 | `bun run db:migrate` 수동 |

**로컬 개발 원칙**: `bun run start:dev` 한 줄로 Docker 없이 완전히 동작해야 한다.

## 3. 구현 순서 (Infrastructure-first)

1. Docker Compose (postgres + redis)
2. Database 모듈 (Drizzle ORM, 환경별 드라이버)
3. Cache 모듈 (환경별 자동 전환)
4. Seeder & Factory 기본 체계
5. Healthcheck 확장 (DB + Cache 상태 포함)

## 4. 폴더 구조

```
src/shared/infrastructure/
├── database/
│   ├── database.module.ts          # NestJS 모듈, 환경별 드라이버 선택
│   ├── database.provider.ts        # Drizzle 인스턴스 생성
│   ├── database.token.ts           # DI 토큰 (DRIZZLE_CLIENT)
│   ├── seed.ts                     # 시더 진입점
│   ├── factories/
│   │   └── base.factory.ts         # 공통 팩토리 추상 클래스
│   └── migrations/                 # drizzle-kit 생성 파일 (자동)
└── cache/
    ├── cache.module.ts             # 환경별 캐시 전략 선택
    └── cache.service.ts            # get/set/del 래퍼

src/modules/health/
├── health.controller.ts            # (수정) DB + Cache 상태 포함
├── health.service.ts               # (신규) DB/Cache 헬스체크 로직
└── health.module.ts                # (수정) HealthService 등록

docker-compose.yml                  # (신규) postgres + redis
drizzle.config.ts                   # (신규) drizzle-kit 설정
```

### 스키마 파일 위치 (도메인별 분산)

```
src/modules/users/infrastructure/schema.ts    # users 테이블 정의
src/modules/auth/infrastructure/schema.ts     # (Phase 3에서 추가)
```

Drizzle migrate 시 `schema` 경로를 glob으로 지정해 모든 모듈 스키마를 수집한다.

## 5. Database 모듈

### DI 토큰

```typescript
// database.token.ts
export const DRIZZLE_CLIENT = 'DRIZZLE_CLIENT';
```

### Provider (환경별 드라이버)

```typescript
// database.provider.ts
{
  provide: DRIZZLE_CLIENT,
  useFactory: async (config: ConfigService) => {
    if (config.get('NODE_ENV') === 'production') {
      const { drizzle } = await import('drizzle-orm/postgres-js');
      const postgres = await import('postgres');
      return drizzle(postgres.default(config.get('DATABASE_URL')));
    } else {
      const { drizzle } = await import('drizzle-orm/better-sqlite3');
      const Database = await import('better-sqlite3');
      return drizzle(new Database.default(config.get('DATABASE_URL')));
    }
  },
  inject: [ConfigService],
}
```

### Migration 자동 실행 (개발/테스트)

```typescript
// database.module.ts - onModuleInit()
if (NODE_ENV !== 'production') {
  await migrate(db, { migrationsFolder: './migrations' });
}
```

운영 환경은 `bun run db:migrate` 스크립트로 명시적 실행.

### 추가 package.json scripts

```json
"db:generate": "drizzle-kit generate",
"db:migrate":  "drizzle-kit migrate",
"db:studio":   "drizzle-kit studio",
"db:seed":     "bun run src/shared/infrastructure/database/seed.ts"
```

## 6. Cache 모듈

### 환경별 전략

```typescript
// cache.module.ts
CacheModule.registerAsync({
  useFactory: (config: ConfigService) => {
    if (config.get('NODE_ENV') === 'production') {
      return {
        store: redisStore,   // cache-manager-ioredis-yet
        url: config.get('REDIS_URL'),
        ttl: 60,
      };
    }
    return { store: 'memory', ttl: 60 };
  },
  inject: [ConfigService],
});
```

### CacheService

```typescript
// cache.service.ts
@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | null>
  async set<T>(key: string, value: T, ttl?: number): Promise<void>
  async del(key: string): Promise<void>
}
```

- 개발/테스트: Docker 없이 인메모리로 동작
- 운영: `REDIS_URL` 환경변수로 Redis 자동 연결
- 도메인/애플리케이션 계층은 `CacheService`만 의존

## 7. Seeder & Factory 체계

### Base Factory

```typescript
// base.factory.ts
export abstract class BaseFactory<T> {
  abstract build(overrides?: Partial<T>): T;

  buildMany(count: number, overrides?: Partial<T>): T[] {
    return Array.from({ length: count }, () => this.build(overrides));
  }
}
```

### 사용 패턴

```typescript
// 유닛 테스트 - DB insert 없음
const user = UserFactory.build({ email: 'test@example.com' });

// 시딩 - DB insert
const users = UserFactory.buildMany(10);
await db.insert(usersTable).values(users);
```

### 시더 진입점

```typescript
// seed.ts
async function seed() {
  console.log('Seeding complete');
  // Phase 3~4에서 각 도메인 시더 추가
}
seed().catch(console.error);
```

## 8. Healthcheck 확장

### 확장된 응답 포맷

```json
// 정상
{ "success": true, "data": { "status": "ok", "db": "ok", "cache": "ok" } }

// 부분 장애
{ "success": true, "data": { "status": "degraded", "db": "ok", "cache": "error" } }
```

### HTTP 상태코드

| status | HTTP 코드 |
|--------|-----------|
| `ok` | 200 |
| `degraded` | 503 |

### HealthService

```typescript
@Injectable()
export class HealthService {
  async checkDb(): Promise<'ok' | 'error'>    // SELECT 1 실행
  async checkCache(): Promise<'ok' | 'error'> // set/get/del 테스트
}
```

- 각 체크는 독립적으로 실행 (Promise.all)
- 실패해도 앱은 계속 응답 (서킷브레이커 아님)
- 결과를 로그에 기록하여 모니터링 가능

## 9. Docker Compose

`docker-compose.yml` — 운영 의존 서비스만 (앱 제외):

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

## 10. 수용 기준

- [ ] `bun run start:dev` — Docker 없이 SQLite + 인메모리 캐시로 정상 기동
- [ ] `bun run db:generate` — 스키마에서 마이그레이션 SQL 생성
- [ ] `bun run db:seed` — 시더 실행 완료
- [ ] `GET /health` → `{ status, db, cache }` 모두 포함
- [ ] DB 연결 실패 시 `/health` 503 반환
- [ ] 캐시 연결 실패 시 `/health` 503 반환
- [ ] `docker compose up -d` — postgres + redis 기동 및 healthcheck 통과
- [ ] 운영 환경(PostgreSQL + Redis) 연결 확인
- [ ] 유닛 테스트 전체 통과
- [ ] e2e 테스트 전체 통과
