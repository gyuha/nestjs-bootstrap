# src/ 전체 파일 주석 추가 설계

**날짜:** 2026-04-23  
**대상:** NestJS 입문자  
**언어:** 한국어  
**범위:** `src/` 하위 35개 파일 전체

---

## 목표

NestJS를 처음 접하는 개발자가 이 부트스트랩 프로젝트를 읽을 때,  
각 파일이 왜 존재하는지, 어떤 NestJS 개념이 사용됐는지, 언제 수정해야 하는지  
주석만 읽어도 파악할 수 있도록 한다.

---

## 주석 형식

### 1. 파일 상단 블록 (JSDoc 스타일)

```ts
/**
 * [파일 역할 한 줄 요약]
 *
 * [NestJS 입문자를 위한 2~4줄 설명]
 * - 이 파일이 왜 존재하는지
 * - 어떤 NestJS 개념이 사용됐는지 (데코레이터, 미들웨어, 모듈 등)
 * - 어떤 상황에서 이 파일을 수정하게 되는지
 */
```

### 2. 클래스 / 함수 단위 한 줄 요약

```ts
/** HTTP 요청마다 traceId를 생성하거나 헤더에서 가져와 request 객체에 주입합니다. */
export class TraceIdMiddleware implements NestMiddleware { ... }
```

### 3. 복잡한 로직 인라인 보조 주석 (필요한 경우에만)

```ts
// DB 드라이버가 sqlite일 때와 postgres일 때 종료 방식이 다릅니다.
if (this.databaseClient.driver === 'sqlite') { ... }
```

---

## 파일별 주석 계획

### `src/` 진입점 (4개)

| 파일 | 핵심 설명 포인트 |
|------|-----------------|
| `main.ts` | NestFactory로 앱 인스턴스를 생성하는 진입점, 포트 수신 흐름 |
| `app.module.ts` | 루트 모듈, ThrottlerModule(요청 속도 제한), APP_GUARD 전역 등록 |
| `app.controller.ts` | 루트 경로(`/api`) 라우터 |
| `app.service.ts` | 루트 서비스 |

### `bootstrap/` (11개) — 앱 초기화 설정

| 파일 | 핵심 설명 포인트 |
|------|-----------------|
| `bootstrap-application.ts` | 미들웨어 등록 순서, 글로벌 프리픽스, URI 버전 관리, 프로덕션 미제공 Swagger |
| `config/app-config.schema.ts` | Zod로 환경변수를 검증하는 이유, superRefine으로 DB 드라이버별 조건 검증 |
| `config/app-config.service.ts` | NestJS ConfigService를 래핑해 타입 안전하게 접근하는 패턴 |
| `config/app-config.module.ts` | `isGlobal: true`로 어디서나 주입 가능한 전역 설정 모듈 |
| `config/load-app-config.ts` | 환경변수 파싱 진입점, 실패 시 즉시 에러로 앱 중단 |
| `logging/trace-id.middleware.ts` | 요청마다 traceId 부여, AsyncLocalStorage로 비동기 컨텍스트 전파 |
| `logging/trace-id.constants.ts` | `x-trace-id` 헤더명을 상수로 분리해 오타 방지 |
| `logging/request-logger.middleware.ts` | `response.on('finish')` 이벤트를 이용해 응답 완료 후 로깅 |
| `security/setup-security.ts` | Helmet(보안 헤더), CORS 설정 |
| `swagger/setup-swagger.ts` | Swagger 자동 문서화 설정, 개발 환경에서만 노출 |
| `validation/setup-validation.ts` | class-validator 기반 전역 ValidationPipe 등록 |

### `modules/health/` (3개) — 헬스체크

| 파일 | 핵심 설명 포인트 |
|------|-----------------|
| `health.controller.ts` | `GET /api/v1/health`, `GET /api/v1/health/details` 엔드포인트 |
| `health.service.ts` | DB·Redis 상태를 집계해 전체 시스템 헬스 판단 |
| `health.module.ts` | 헬스체크 모듈 조립, DatabaseModule·CacheModule 의존 |

### `shared/` (11개) — 공통 인프라

| 파일 | 핵심 설명 포인트 |
|------|-----------------|
| `infrastructure/request-context.ts` | AsyncLocalStorage로 요청 컨텍스트(traceId)를 전역 접근 가능하게 전파 |
| `presentation/api-response.ts` | 성공 응답을 `{ success, data, meta }` 형태로 통일하는 헬퍼 |
| `presentation/global-exception.filter.ts` | 모든 예외를 잡아 `{ success: false, error, meta }` 형태로 응답 |
| `infrastructure/database/database.service.ts` | Drizzle ORM 클라이언트 초기화, ping, 앱 종료 시 연결 해제 |
| `infrastructure/database/database.module.ts` | DatabaseService·DatabaseHealthService 제공 및 내보내기 |
| `infrastructure/database/create-database-client.ts` | postgres/sqlite 드라이버 분기 생성 로직 |
| `infrastructure/database/database-health.service.ts` | DB ping으로 헬스 상태 확인 |
| `infrastructure/database/database.constants.ts` | DB 관련 주입 토큰 상수 |
| `infrastructure/database/database.types.ts` | Drizzle 클라이언트 유니온 타입 정의 |
| `infrastructure/cache/cache.service.ts` | ioredis 클라이언트 초기화, ping, 앱 종료 시 연결 해제 |
| `infrastructure/cache/cache.module.ts` | CacheService·CacheExampleService·CacheHealthService 제공 |
| `infrastructure/cache/cache-health.service.ts` | Redis ping으로 헬스 상태 확인 |
| `infrastructure/cache/cache-example.service.ts` | Redis 사용 예시 서비스 |
| `infrastructure/cache/cache.constants.ts` | Redis 레이지 연결 옵션 상수 |
| `types/better-sqlite3.d.ts` | better-sqlite3 모듈의 타입 선언 보강 |

---

## 제외 사항

- 코드가 이미 명확히 설명하는 것(변수명, 타입)은 주석으로 반복하지 않는다.
- 구현 세부사항(어떻게)보다 목적(왜)에 집중한다.
- 영어 주석은 사용하지 않는다.
