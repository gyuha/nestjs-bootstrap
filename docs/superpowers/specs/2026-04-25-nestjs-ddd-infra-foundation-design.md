# NestJS DDD Infra Foundation 설계

## 1. 목적

이 문서는 `PRD.md`의 Phase 1-2 범위를 기준으로 NestJS DDD Bootstrap Project의 인프라 우선 설계를 정의한다.

이번 범위는 인증, 사용자 CRUD, RBAC 같은 비즈니스 기능을 구현하지 않는다. 대신 이후 `auth`, `users` 모듈이 일관된 DDD 구조 위에 추가될 수 있도록 프로젝트 골격, 공통 bootstrap, 데이터베이스, Redis, Docker, 테스트 기반을 먼저 고정한다.

## 2. 결정 사항

- 범위는 Phase 1-2로 제한한다.
- 접근 방식은 얇은 DDD 인프라 우선 설계로 한다.
- DB는 로컬, 테스트, 운영 모두 PostgreSQL 단일 기준으로 한다.
- SQLite는 도입하지 않는다.
- Redis는 연결, 공통 provider, healthcheck까지만 포함한다.
- 마이그레이션은 `local`, `test`에서 자동 실행을 허용하고, `staging`, `production`에서는 앱 시작 시 자동 실행하지 않는다.
- Docker는 개발용 compose와 운영용 multi-stage Dockerfile을 모두 포함한다.

## 3. 아키텍처

프로젝트는 NestJS 기반 모듈러 모놀리스로 구성한다. 코드 구조는 DDD 4계층을 기본 규칙으로 삼되, Phase 1-2에서는 실제 도메인 기능을 깊게 만들지 않는다.

기본 구조는 다음과 같다.

```text
src/
  main.ts
  app.module.ts
  bootstrap/
    config/
    swagger/
    validation/
    security/
    logging/
  shared/
    domain/
    application/
    infrastructure/
    presentation/
  modules/
    health/
      presentation/
      health.module.ts
```

`bootstrap`은 Nest 애플리케이션 시작 시 필요한 횡단 설정을 담당한다. Config validation, API versioning, Swagger, CORS, Helmet, request logging, trace id 설정이 여기에 포함된다.

`shared`는 도메인 모듈들이 재사용하는 공통 추상화와 구현을 담는다. `shared/domain`에는 공통 domain error, value object 기반을 둘 수 있고, `shared/infrastructure`에는 Drizzle DB provider, Redis provider, logger adapter 같은 실제 인프라 구현을 둔다.

초기 모듈은 `health`만 둔다. `health`는 DDD 예제 도메인이 아니라 운영 확인을 위한 presentation 중심 모듈로 취급한다. 실제 DDD 4계층 예제는 후속 Auth/Users 단계에서 추가한다.

## 4. Config와 Bootstrap

설정은 `@nestjs/config`와 Zod 기반 validation으로 구성한다. 앱 시작 시 필수 환경 변수가 없거나 타입이 맞지 않으면 즉시 실패한다.

환경은 다음 값을 기준으로 구분한다.

- `local`
- `test`
- `staging`
- `production`

권장 bootstrap 구조는 다음과 같다.

```text
bootstrap/
  config/
    env.schema.ts
    app-config.ts
    database-config.ts
    redis-config.ts
  swagger/
    setup-swagger.ts
  validation/
    setup-validation.ts
  security/
    setup-security.ts
  logging/
    trace-id.middleware.ts
    request-logger.middleware.ts
```

API versioning은 URI 방식으로 기본 활성화한다. 기본 prefix는 `/api`, 기본 버전은 `v1`로 한다.

Swagger는 local 환경에서 노출한다. staging과 production에서 Swagger를 노출할지는 별도 환경 변수로 제어한다.

보안 bootstrap은 CORS, Helmet, rate limit 설정을 담당한다. rate limit은 Phase 1-2에서 기본 설정과 확장 지점만 제공하고, 도메인별 정책은 후속 단계에서 조정한다.

## 5. 공통 요청 처리

Trace ID는 요청 헤더 `x-request-id`가 있으면 이어받고, 없으면 새로 생성한다. 생성된 trace id는 request context, response header, request logger, exception filter에서 동일하게 사용한다.

공통 응답 포맷은 interceptor로 적용한다. 단, healthcheck처럼 외부 시스템이 단순 응답을 기대하는 endpoint는 예외를 허용한다.

표준 에러 응답은 global exception filter에서 처리한다. 응답에는 다음 필드를 포함한다.

```text
traceId
statusCode
message
errorCode
timestamp
path
```

로깅은 Nest 기본 logger를 직접 여러 곳에서 호출하지 않고, 추후 Pino 같은 구현으로 교체 가능한 얇은 logger abstraction을 둔다.

## 6. 데이터베이스 설계

DB는 PostgreSQL 단일 기준으로 구성한다. Drizzle 관련 코드는 `shared/infrastructure/database`에 둔다.

```text
shared/infrastructure/database/
  database.module.ts
  database.provider.ts
  database.types.ts
  migrations/
  schema/
    index.ts
```

도메인 모듈은 Drizzle에 직접 의존하지 않는다. 후속 도메인 모듈은 repository interface와 adapter를 다음 규칙으로 분리한다.

```text
modules/<domain>/
  domain/repositories/*.repository.ts
  infrastructure/persistence/*.drizzle.ts
```

마이그레이션 정책은 환경별로 나눈다.

- `local`, `test`: 앱 시작 전 또는 시작 시 자동 실행 허용
- `staging`, `production`: 앱 시작 시 자동 실행 금지
- 운영 마이그레이션: `pnpm db:migrate` 또는 별도 job/entrypoint로 실행

테스트 DB도 PostgreSQL을 사용한다. `test` 환경은 별도 database name을 사용하고, e2e 실행 전 migration을 적용한 뒤 테스트 종료 후 정리한다.

## 7. Redis 설계

Redis는 Phase 1-2에서 인프라 연결 대상으로만 취급한다.

```text
shared/infrastructure/redis/
  redis.module.ts
  redis.provider.ts
  redis.health.ts
```

구현 범위는 연결 provider, 설정 validation, healthcheck다. 캐시 서비스, refresh token 저장소, session store는 만들지 않는다. Auth 단계에서 저장 정책을 확정한 뒤 Redis 사용 범위를 다시 설계한다.

## 8. Docker와 실행 환경

로컬 개발용 `docker-compose.yml`은 `app`, `postgres`, `redis`를 포함한다. `postgres`와 `redis`에는 healthcheck를 둔다. 개발 환경은 두 실행 방식을 모두 지원한다. 첫 번째는 PostgreSQL과 Redis만 compose로 띄우고 앱은 호스트에서 `pnpm dev`로 실행하는 방식이다. 두 번째는 compose로 앱, PostgreSQL, Redis를 모두 실행하는 방식이다.

앱용 `Dockerfile`은 multi-stage build로 구성한다.

```text
base -> deps -> build -> runtime
```

runtime 이미지는 production dependency와 빌드 산출물만 포함한다. 기본 command는 앱 실행이다. staging과 production에서 마이그레이션은 앱 시작 시 자동 실행하지 않고, 별도 command 또는 job으로 실행한다.

Healthcheck endpoint는 `/api/v1/health`로 둔다. 응답은 앱 상태, PostgreSQL 연결 상태, Redis 연결 상태를 포함한다. 모든 의존성이 정상인 경우 200을 반환하고, 의존성 장애가 있으면 503을 반환한다.

## 9. 개발 워크플로우

패키지 매니저는 pnpm을 기준으로 한다.

표준 스크립트는 다음을 포함한다.

```text
pnpm dev
pnpm build
pnpm lint
pnpm format
pnpm format:check
pnpm test
pnpm test:e2e
pnpm db:generate
pnpm db:migrate
pnpm db:studio
pnpm docker:up
pnpm docker:down
```

Biome은 lint와 format을 통합한다. Husky pre-push에서는 `lint`, `format:check`, `test`를 실행한다. Commitlint는 Conventional Commits를 강제한다.

## 10. 테스트 설계

테스트는 PostgreSQL 기반으로 통일한다.

권장 테스트 구조는 다음과 같다.

```text
test/
  setup/
    test-app.ts
    test-database.ts
  fixtures/
  factories/
```

Phase 1-2의 초기 테스트 대상은 다음이다.

- 앱 부팅 테스트
- config validation 성공/실패 테스트
- `/api/v1/health` e2e 테스트
- trace id가 응답, 로그, 에러에 연결되는지 확인하는 기본 테스트
- PostgreSQL migration 적용 가능성 테스트

후속 도메인 모듈이 생기면 unit test는 domain/application 계층을 repository port mock으로 검증하고, e2e test는 실제 Nest 앱과 PostgreSQL test DB를 사용한다.

## 11. Phase 1-2 수용 기준

- NestJS 앱이 `pnpm dev`로 실행된다.
- `GET /api/v1/health`가 앱, PostgreSQL, Redis 상태를 반환한다.
- Swagger가 local 환경에서 노출된다.
- 잘못된 환경 변수로 앱이 시작되지 않는다.
- Drizzle migration 명령이 동작한다.
- `local`, `test` 환경에서는 migration 자동 실행 정책이 적용 가능하다.
- `staging`, `production` 환경에서는 앱 시작 시 migration 자동 실행이 꺼진다.
- Docker compose로 앱, PostgreSQL, Redis 실행이 가능하다.
- 앱 Dockerfile은 multi-stage build를 사용한다.
- Biome, Husky, Commitlint 기반 품질 게이트가 존재한다.
- 후속 `auth`, `users` 모듈이 DDD 4계층으로 추가될 위치와 규칙이 문서화되어 있다.

## 12. 후속 단계로 넘기는 항목

다음 항목은 Phase 1-2에서 구현하지 않는다.

- OAuth login flow
- JWT access token 발급 및 검증
- refresh token 저장 전략
- RBAC role 체계
- Users CRUD
- 사용자 프로필, 상태, 권한 관리
- Redis 기반 cache/session/token 저장소

위 항목은 Auth/Users 설계에서 별도 결정한다.
