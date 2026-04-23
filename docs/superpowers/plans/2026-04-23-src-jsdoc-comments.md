# src/ 전체 JSDoc/TSDoc 한국어 주석 추가 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `src/` 아래의 모든 TypeScript 파일(소스 + `*.spec.ts`)에 한국어 JSDoc/TSDoc 주석을 추가하여 코드 이해도를 높인다.

**Architecture:** 5개의 독립 태스크로 나누어 병렬 에이전트로 처리한다. 각 태스크는 서로 다른 파일 집합을 담당하므로 충돌이 없다. 루트 파일 2개는 Task 0에서 직접 처리하고, Tasks 1–4는 동시에 실행 가능하다. 모든 태스크 완료 후 Task 5에서 lint/test를 검증하고 최종 커밋한다.

**Tech Stack:** NestJS (TypeScript), Bun, Biome (lint/format), Jest (test)

---

## 공통 JSDoc 주석 규칙

> 모든 태스크 에이전트는 이 규칙을 동일하게 따른다.

### 적용 대상

| 대상 | 형식 |
|---|---|
| 클래스 | `/** 클래스 역할 설명 (한 줄) */` — `@Injectable()` 등 데코레이터 바로 위 |
| public 메서드 | `/** 동작 설명 @param ... @returns ... */` |
| 인터페이스 / 타입 | `/** 타입 역할 설명 */` |
| DTO 클래스 | `/** 요청/응답 데이터 구조 설명 */` |
| DTO 필드 | `/** 필드 설명 */` |
| 데코레이터 함수 | `/** 데코레이터 역할 설명 */` |
| `describe` 블록 (spec) | `/** 테스트 대상 및 범위 설명 */` |
| `it` 블록 (spec) | 이름만으로 의미가 불분명할 경우에만 `/** ... */` 추가 |

### 주석 제외 대상

- import 구문
- 단순 getter/setter (`get name() { return this._name; }` 등)
- `@Module({ imports: [...] })` 같은 NestJS 데코레이터 파라미터 내부
- constructor 주입 파라미터 (타입으로 역할이 명확한 경우)
- `void` 메서드의 `@returns` 태그

### 예시

```ts
/** 사용자 인증 및 토큰 발급을 담당하는 서비스 */
@Injectable()
export class AuthService {
  /** 이메일과 비밀번호로 사용자를 검증하고 JWT 토큰 쌍을 반환한다.
   * @param email 사용자 이메일
   * @param password 평문 비밀번호
   * @returns 서명된 액세스/리프레시 토큰 쌍
   */
  async login(email: string, password: string): Promise<TokenPair> { ... }
}

/** 사용자 로그인 요청 DTO */
export class LoginDto {
  /** 가입 시 등록한 이메일 주소 */
  @IsEmail()
  email: string;

  /** 평문 비밀번호 (8자 이상) */
  @IsString()
  password: string;
}
```

```ts
/** AuthService의 단위 테스트 스위트 */
describe('AuthService', () => {
  /** 올바른 자격증명으로 로그인 시 토큰을 반환해야 한다 */
  it('should return tokens for valid credentials', async () => { ... });
});
```

---

## Task 0: 루트 파일 주석 추가

**담당 파일:**
- Modify: `src/main.ts`
- Modify: `src/app.module.ts`

- [ ] **Step 1: `src/main.ts` 읽기**

```bash
cat src/main.ts
```

- [ ] **Step 2: `src/main.ts`에 JSDoc 추가**

`bootstrap()` 함수에 아래 형식으로 주석 추가:

```ts
/** NestJS 애플리케이션을 초기화하고 HTTP 서버를 시작하는 진입점 함수 */
async function bootstrap() { ... }
```

- [ ] **Step 3: `src/app.module.ts` 읽기**

```bash
cat src/app.module.ts
```

- [ ] **Step 4: `src/app.module.ts`에 JSDoc 추가**

```ts
/** 애플리케이션의 루트 모듈 — 모든 기능 모듈과 공통 인프라를 등록한다 */
@Module({ ... })
export class AppModule { ... }
```

- [ ] **Step 5: lint 검증**

```bash
bun run lint
```

정상 종료(에러 없음) 확인.

- [ ] **Step 6: 커밋**

```bash
git add src/main.ts src/app.module.ts
git commit -m "docs: add JSDoc comments to main.ts and app.module.ts"
```

---

## Task 1: bootstrap/ 주석 추가

**담당 파일 (15개):**
- `src/bootstrap/admin/bull-board.setup.ts`
- `src/bootstrap/logging/pino.config.ts`
- `src/bootstrap/logging/trace.middleware.ts`
- `src/bootstrap/logging/trace.middleware.spec.ts`
- `src/bootstrap/metrics/metrics.controller.ts`
- `src/bootstrap/metrics/metrics.middleware.ts`
- `src/bootstrap/metrics/metrics.middleware.spec.ts`
- `src/bootstrap/metrics/metrics.module.ts`
- `src/bootstrap/metrics/metrics.store.ts`
- `src/bootstrap/metrics/metrics.store.spec.ts`
- `src/bootstrap/security/security.setup.ts`
- `src/bootstrap/swagger/swagger-response.decorator.ts`
- `src/bootstrap/swagger/swagger.setup.ts`
- `src/bootstrap/validation/env.schema.ts`
- `src/bootstrap/validation/env.schema.spec.ts`

- [ ] **Step 1: 파일들 읽기**

각 파일을 순서대로 읽어 내용 파악:

```bash
cat src/bootstrap/admin/bull-board.setup.ts
cat src/bootstrap/logging/pino.config.ts
cat src/bootstrap/logging/trace.middleware.ts
cat src/bootstrap/logging/trace.middleware.spec.ts
cat src/bootstrap/metrics/metrics.controller.ts
cat src/bootstrap/metrics/metrics.middleware.ts
cat src/bootstrap/metrics/metrics.middleware.spec.ts
cat src/bootstrap/metrics/metrics.module.ts
cat src/bootstrap/metrics/metrics.store.ts
cat src/bootstrap/metrics/metrics.store.spec.ts
cat src/bootstrap/security/security.setup.ts
cat src/bootstrap/swagger/swagger-response.decorator.ts
cat src/bootstrap/swagger/swagger.setup.ts
cat src/bootstrap/validation/env.schema.ts
cat src/bootstrap/validation/env.schema.spec.ts
```

- [ ] **Step 2: 각 파일에 JSDoc 주석 추가**

공통 규칙에 따라 각 파일을 편집한다. 주요 기대 결과:

`bull-board.setup.ts`:
```ts
/** Bull 큐 모니터링 대시보드(Bull Board)를 NestJS 앱에 마운트하는 설정 함수 */
export function setupBullBoard(app: INestApplication): void { ... }
```

`pino.config.ts`:
```ts
/** Pino 로거의 기본 설정 객체 — 로그 레벨, 포맷, 트레이스 ID 포함 여부를 정의한다 */
export const pinoConfig: Params = { ... };
```

`trace.middleware.ts`:
```ts
/** 각 HTTP 요청에 고유한 트레이스 ID를 부여하고 로그에 포함시키는 미들웨어 */
@Injectable()
export class TraceMiddleware implements NestMiddleware { ... }

/** HTTP 요청에 X-Trace-Id 헤더를 추가하고 AsyncLocalStorage에 저장한다.
 * @param req HTTP 요청 객체
 * @param res HTTP 응답 객체
 * @param next 다음 미들웨어 호출 함수
 */
use(req: Request, res: Response, next: NextFunction): void { ... }
```

`metrics.store.ts`:
```ts
/** Prometheus 메트릭 레지스트리와 개별 메트릭 인스턴스를 보관하는 저장소 */
@Injectable()
export class MetricsStore { ... }
```

`metrics.middleware.ts`:
```ts
/** HTTP 요청/응답 정보를 Prometheus 히스토그램과 카운터에 기록하는 미들웨어 */
@Injectable()
export class MetricsMiddleware implements NestMiddleware { ... }
```

`metrics.controller.ts`:
```ts
/** Prometheus 형식의 메트릭 데이터를 /metrics 엔드포인트로 노출하는 컨트롤러 */
@Controller('metrics')
export class MetricsController { ... }
```

`env.schema.ts` (환경 변수 스키마 클래스 및 각 필드):
```ts
/** 환경 변수 유효성 검사 스키마 — 필수 설정 누락 시 애플리케이션 시작을 차단한다 */
export class EnvSchema {
  /** PostgreSQL 연결 문자열 */
  @IsString()
  DATABASE_URL: string;
  // 나머지 필드도 동일 패턴으로 추가
}
```

`swagger.setup.ts`:
```ts
/** Swagger UI와 OpenAPI 문서를 NestJS 앱에 등록하는 설정 함수 */
export function setupSwagger(app: INestApplication): void { ... }
```

`swagger-response.decorator.ts`:
```ts
/** 공통 API 응답 형식을 Swagger 문서에 등록하는 복합 데코레이터 */
export const SwaggerResponse = (...) => { ... };
```

`security.setup.ts`:
```ts
/** Helmet, CORS, Rate Limiting 등 보안 관련 미들웨어를 NestJS 앱에 적용하는 설정 함수 */
export function setupSecurity(app: INestApplication): void { ... }
```

나머지 spec 파일은 `describe` 블록 위에 `/** ... 테스트 스위트 */` 형식으로 추가.

- [ ] **Step 3: lint 검증**

```bash
bun run lint
```

정상 종료 확인. 오류 발생 시 해당 파일 수정 후 재실행.

- [ ] **Step 4: 커밋**

```bash
git add src/bootstrap/
git commit -m "docs: add JSDoc comments to bootstrap/ files"
```

---

## Task 2: shared/infrastructure/ 주석 추가

**담당 파일 (55개):**

```
src/shared/infrastructure/audit/audit.listener.ts
src/shared/infrastructure/audit/audit.listener.spec.ts
src/shared/infrastructure/audit/audit.module.ts
src/shared/infrastructure/audit/audit.service.ts
src/shared/infrastructure/audit/audit.service.spec.ts
src/shared/infrastructure/audit/schemas/audit-log.schema.ts
src/shared/infrastructure/cache/cache.module.ts
src/shared/infrastructure/cache/cache.service.ts
src/shared/infrastructure/cache/cache.service.spec.ts
src/shared/infrastructure/database/database.module.ts
src/shared/infrastructure/database/database.provider.ts
src/shared/infrastructure/database/database.schema.ts
src/shared/infrastructure/database/database.token.ts
src/shared/infrastructure/database/factories/base.factory.ts
src/shared/infrastructure/database/seed.ts
src/shared/infrastructure/email/email.module.ts
src/shared/infrastructure/email/email.processor.ts
src/shared/infrastructure/email/email.processor.spec.ts
src/shared/infrastructure/email/email.service.ts
src/shared/infrastructure/email/email.service.spec.ts
src/shared/infrastructure/email/email.token.ts
src/shared/infrastructure/email/providers/email-provider.interface.ts
src/shared/infrastructure/email/providers/log.provider.ts
src/shared/infrastructure/email/providers/log.provider.spec.ts
src/shared/infrastructure/email/providers/resend.provider.ts
src/shared/infrastructure/email/providers/resend.provider.spec.ts
src/shared/infrastructure/email/providers/smtp.provider.ts
src/shared/infrastructure/email/providers/smtp.provider.spec.ts
src/shared/infrastructure/gateway/app.gateway.ts
src/shared/infrastructure/gateway/app.gateway.spec.ts
src/shared/infrastructure/gateway/gateway.module.ts
src/shared/infrastructure/gateway/gateway.service.ts
src/shared/infrastructure/gateway/gateway.service.spec.ts
src/shared/infrastructure/image/image.module.ts
src/shared/infrastructure/image/image.service.ts
src/shared/infrastructure/image/image.service.spec.ts
src/shared/infrastructure/monitoring/monitoring.module.ts
src/shared/infrastructure/monitoring/error-tracking.service.ts
src/shared/infrastructure/monitoring/error-tracking.service.spec.ts
src/shared/infrastructure/queue/queue.interface.ts
src/shared/infrastructure/queue/queue.module.ts
src/shared/infrastructure/queue/queue.service.ts
src/shared/infrastructure/queue/queue.service.spec.ts
src/shared/infrastructure/queue/queue.token.ts
src/shared/infrastructure/redis/redis.module.ts
src/shared/infrastructure/redis/redis.provider.ts
src/shared/infrastructure/redis/redis.provider.spec.ts
src/shared/infrastructure/storage/providers/storage-provider.interface.ts
src/shared/infrastructure/storage/providers/local.provider.ts
src/shared/infrastructure/storage/providers/local.provider.spec.ts
src/shared/infrastructure/storage/providers/s3.provider.ts
src/shared/infrastructure/storage/providers/s3.provider.spec.ts
src/shared/infrastructure/storage/storage.module.ts
src/shared/infrastructure/storage/storage.service.ts
src/shared/infrastructure/storage/storage.token.ts
```

- [ ] **Step 1: 하위 디렉토리별로 파일 읽기**

```bash
# audit
cat src/shared/infrastructure/audit/audit.service.ts
cat src/shared/infrastructure/audit/audit.listener.ts
cat src/shared/infrastructure/audit/schemas/audit-log.schema.ts

# cache
cat src/shared/infrastructure/cache/cache.service.ts

# database
cat src/shared/infrastructure/database/database.provider.ts
cat src/shared/infrastructure/database/database.schema.ts
cat src/shared/infrastructure/database/factories/base.factory.ts

# email
cat src/shared/infrastructure/email/email.service.ts
cat src/shared/infrastructure/email/email.processor.ts
cat src/shared/infrastructure/email/providers/email-provider.interface.ts

# gateway
cat src/shared/infrastructure/gateway/app.gateway.ts
cat src/shared/infrastructure/gateway/gateway.service.ts

# image
cat src/shared/infrastructure/image/image.service.ts

# monitoring
cat src/shared/infrastructure/monitoring/error-tracking.service.ts

# queue
cat src/shared/infrastructure/queue/queue.interface.ts
cat src/shared/infrastructure/queue/queue.service.ts

# redis
cat src/shared/infrastructure/redis/redis.provider.ts

# storage
cat src/shared/infrastructure/storage/providers/storage-provider.interface.ts
cat src/shared/infrastructure/storage/storage.service.ts
```

나머지 파일(모듈, 토큰, spec)도 동일하게 읽는다.

- [ ] **Step 2: 각 파일에 JSDoc 주석 추가**

공통 규칙에 따라 처리. 주요 기대 결과:

`audit.service.ts`:
```ts
/** 감사 로그를 데이터베이스에 기록하는 서비스 */
@Injectable()
export class AuditService {
  /** 감사 로그 항목을 생성하여 저장한다.
   * @param payload 기록할 감사 이벤트 정보
   */
  async log(payload: AuditPayload): Promise<void> { ... }
}
```

`audit.listener.ts`:
```ts
/** 도메인 이벤트를 수신하여 감사 로그를 자동 기록하는 이벤트 리스너 */
@Injectable()
export class AuditListener { ... }
```

`audit-log.schema.ts` (Drizzle 스키마):
```ts
/** 감사 로그 테이블 스키마 — 누가 언제 무엇을 했는지 기록한다 */
export const auditLogs = pgTable('audit_logs', { ... });
```

`cache.service.ts`:
```ts
/** Redis를 백엔드로 사용하는 범용 캐시 서비스 */
@Injectable()
export class CacheService {
  /** 키에 해당하는 캐시 값을 반환한다. 없으면 null.
   * @param key 캐시 키
   * @returns 캐시된 값 또는 null
   */
  async get<T>(key: string): Promise<T | null> { ... }

  /** 키-값 쌍을 TTL(초 단위)과 함께 저장한다.
   * @param key 캐시 키
   * @param value 저장할 값
   * @param ttl 만료 시간(초), 기본값은 설정값 사용
   */
  async set(key: string, value: unknown, ttl?: number): Promise<void> { ... }
}
```

`database.provider.ts`:
```ts
/** 환경 변수의 DATABASE_URL을 이용해 Drizzle ORM 인스턴스를 생성하는 팩토리 프로바이더 */
export const databaseProvider = { ... };
```

`email-provider.interface.ts`:
```ts
/** 이메일 발송 기능을 추상화한 인터페이스 — SMTP, Resend, 로그 구현체가 이를 구현한다 */
export interface EmailProvider {
  /** 이메일을 발송한다.
   * @param options 수신자, 제목, 본문 등 이메일 옵션
   */
  send(options: EmailOptions): Promise<void>;
}
```

`app.gateway.ts` (WebSocket):
```ts
/** WebSocket 연결을 관리하고 실시간 이벤트를 브로드캐스트하는 게이트웨이 */
@WebSocketGateway()
export class AppGateway { ... }
```

`storage-provider.interface.ts`:
```ts
/** 파일 저장소를 추상화한 인터페이스 — 로컬 및 S3 구현체가 이를 구현한다 */
export interface StorageProvider {
  /** 파일을 저장소에 업로드한다.
   * @param file 업로드할 파일 버퍼와 메타데이터
   * @returns 저장된 파일의 접근 URL
   */
  upload(file: FileUpload): Promise<string>;
}
```

`error-tracking.service.ts`:
```ts
/** 애플리케이션 오류를 수집하고 Prometheus 히스토그램에 기록하는 서비스 */
@Injectable()
export class ErrorTrackingService { ... }
```

`queue.interface.ts`:
```ts
/** 비동기 작업 큐를 추상화한 인터페이스 — Bull 구현체가 이를 따른다 */
export interface QueueService {
  /** 큐에 작업을 추가한다.
   * @param jobName 실행할 작업 이름
   * @param data 작업에 전달할 페이로드
   */
  add(jobName: string, data: unknown): Promise<void>;
}
```

토큰 파일들 (`*.token.ts`):
```ts
/** 의존성 주입 시 EmailProvider 구현체를 식별하는 주입 토큰 */
export const EMAIL_PROVIDER_TOKEN = 'EMAIL_PROVIDER';
```

모듈 파일들 (`*.module.ts`) — 클래스 위에만 주석 추가:
```ts
/** 이메일 발송 기능을 제공하는 모듈 — EmailService와 프로바이더를 등록한다 */
@Module({ ... })
export class EmailModule { }
```

spec 파일들: 각 `describe` 블록 위에 한 줄 주석 추가.

- [ ] **Step 3: lint 검증**

```bash
bun run lint
```

오류 발생 시 해당 파일 수정 후 재실행.

- [ ] **Step 4: 커밋**

```bash
git add src/shared/infrastructure/
git commit -m "docs: add JSDoc comments to shared/infrastructure/ files"
```

---

## Task 3: shared/utils, presentation, decorators, dto 주석 추가

**담당 파일 (30개):**

```
src/shared/decorators/validation/is-past-date.decorator.ts
src/shared/decorators/validation/is-slug.decorator.ts
src/shared/decorators/validation/is-strong-password.decorator.ts
src/shared/decorators/validation/is-uuid.decorator.ts
src/shared/dto/paginated-response.dto.ts
src/shared/dto/pagination.dto.ts
src/shared/presentation/decorators/skip-transform.decorator.ts
src/shared/presentation/dto/api-response.dto.ts
src/shared/presentation/filters/http-exception.filter.ts
src/shared/presentation/filters/http-exception.filter.spec.ts
src/shared/presentation/interceptors/transform.interceptor.ts
src/shared/presentation/interceptors/transform.interceptor.spec.ts
src/shared/utils/array.util.ts
src/shared/utils/array.util.spec.ts
src/shared/utils/date.util.ts
src/shared/utils/date.util.spec.ts
src/shared/utils/env.util.ts
src/shared/utils/env.util.spec.ts
src/shared/utils/file.util.ts
src/shared/utils/file.util.spec.ts
src/shared/utils/hash.util.ts
src/shared/utils/hash.util.spec.ts
src/shared/utils/pagination.util.ts
src/shared/utils/pagination.util.spec.ts
src/shared/utils/retry.util.ts
src/shared/utils/retry.util.spec.ts
src/shared/utils/string.util.ts
src/shared/utils/string.util.spec.ts
src/shared/utils/uuid.util.ts
src/shared/utils/uuid.util.spec.ts
```

- [ ] **Step 1: 파일들 읽기**

```bash
cat src/shared/decorators/validation/is-past-date.decorator.ts
cat src/shared/decorators/validation/is-slug.decorator.ts
cat src/shared/decorators/validation/is-strong-password.decorator.ts
cat src/shared/decorators/validation/is-uuid.decorator.ts
cat src/shared/dto/paginated-response.dto.ts
cat src/shared/dto/pagination.dto.ts
cat src/shared/presentation/decorators/skip-transform.decorator.ts
cat src/shared/presentation/dto/api-response.dto.ts
cat src/shared/presentation/filters/http-exception.filter.ts
cat src/shared/presentation/interceptors/transform.interceptor.ts
cat src/shared/utils/array.util.ts
cat src/shared/utils/date.util.ts
cat src/shared/utils/env.util.ts
cat src/shared/utils/file.util.ts
cat src/shared/utils/hash.util.ts
cat src/shared/utils/pagination.util.ts
cat src/shared/utils/retry.util.ts
cat src/shared/utils/string.util.ts
cat src/shared/utils/uuid.util.ts
```

나머지 spec 파일도 읽는다.

- [ ] **Step 2: 각 파일에 JSDoc 주석 추가**

공통 규칙에 따라 처리. 주요 기대 결과:

`is-past-date.decorator.ts`:
```ts
/** 날짜 값이 현재보다 과거인지 검사하는 커스텀 유효성 검사 데코레이터 */
export function IsPastDate(validationOptions?: ValidationOptions) { ... }
```

`is-slug.decorator.ts`:
```ts
/** 값이 URL 슬러그 형식(소문자, 숫자, 하이픈)인지 검사하는 커스텀 유효성 검사 데코레이터 */
export function IsSlug(validationOptions?: ValidationOptions) { ... }
```

`is-strong-password.decorator.ts`:
```ts
/** 비밀번호가 강도 요건(대소문자, 숫자, 특수문자 포함)을 충족하는지 검사하는 커스텀 유효성 검사 데코레이터 */
export function IsStrongPassword(validationOptions?: ValidationOptions) { ... }
```

`is-uuid.decorator.ts`:
```ts
/** 값이 UUID v4 형식인지 검사하는 커스텀 유효성 검사 데코레이터 */
export function IsUuid(validationOptions?: ValidationOptions) { ... }
```

`pagination.dto.ts`:
```ts
/** 페이지네이션 쿼리 파라미터 DTO */
export class PaginationDto {
  /** 현재 페이지 번호 (1부터 시작) */
  @IsInt()
  page: number;

  /** 페이지당 항목 수 */
  @IsInt()
  limit: number;
}
```

`paginated-response.dto.ts`:
```ts
/** 페이지네이션이 적용된 목록 응답 DTO */
export class PaginatedResponseDto<T> {
  /** 현재 페이지의 데이터 항목 배열 */
  data: T[];

  /** 전체 항목 수 */
  total: number;
}
```

`api-response.dto.ts`:
```ts
/** 모든 API 응답에 공통으로 사용되는 래퍼 DTO */
export class ApiResponseDto<T> {
  /** HTTP 상태 코드 */
  statusCode: number;

  /** 응답 데이터 페이로드 */
  data: T;
}
```

`skip-transform.decorator.ts`:
```ts
/** TransformInterceptor의 응답 래핑을 건너뛰도록 표시하는 데코레이터 */
export const SkipTransform = () => SetMetadata(SKIP_TRANSFORM_KEY, true);
```

`http-exception.filter.ts`:
```ts
/** NestJS HttpException을 잡아 표준화된 JSON 에러 응답으로 변환하는 필터 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  /** HttpException을 잡아 상태 코드와 메시지를 포함한 응답을 반환한다.
   * @param exception 발생한 HttpException 인스턴스
   * @param host 현재 실행 컨텍스트 (HTTP 컨텍스트 추출에 사용)
   */
  catch(exception: HttpException, host: ArgumentsHost): void { ... }
}
```

`transform.interceptor.ts`:
```ts
/** 모든 컨트롤러 응답을 { statusCode, data } 형식으로 래핑하는 인터셉터 */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  /** 응답 스트림을 가로채어 표준 형식으로 변환한다.
   * @param context 실행 컨텍스트
   * @param next 다음 핸들러
   * @returns 래핑된 응답 Observable
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> { ... }
}
```

유틸리티 함수들 (`*.util.ts`):
```ts
// array.util.ts 예시
/** 배열 관련 유틸리티 함수 모음 */

/** 배열에서 중복 값을 제거하여 반환한다.
 * @param arr 중복 제거할 원본 배열
 * @returns 중복이 제거된 새 배열
 */
export function unique<T>(arr: T[]): T[] { ... }

// hash.util.ts 예시
/** 문자열 해싱 및 비교를 위한 유틸리티 함수 모음 */

/** 평문 문자열을 bcrypt로 해싱한다.
 * @param plain 해싱할 평문 문자열
 * @returns 해시된 문자열 (Promise)
 */
export async function hash(plain: string): Promise<string> { ... }

/** 평문과 해시를 비교하여 일치 여부를 반환한다.
 * @param plain 비교할 평문
 * @param hashed 저장된 해시
 * @returns 일치하면 true
 */
export async function compare(plain: string, hashed: string): Promise<boolean> { ... }
```

pagination.util.ts:
```ts
/** 페이지네이션 계산을 위한 유틸리티 함수 모음 */

/** page와 limit으로 DB 쿼리에 필요한 offset을 계산한다.
 * @param page 현재 페이지 번호 (1부터 시작)
 * @param limit 페이지당 항목 수
 * @returns 건너뛸 항목 수 (offset)
 */
export function calcOffset(page: number, limit: number): number { ... }
```

retry.util.ts:
```ts
/** 재시도 로직을 위한 유틸리티 함수 모음 */

/** 지정된 횟수만큼 함수를 재시도한다. 모든 시도 실패 시 마지막 에러를 던진다.
 * @param fn 실행할 비동기 함수
 * @param retries 최대 재시도 횟수
 * @returns 성공 시 함수의 반환값
 */
export async function withRetry<T>(fn: () => Promise<T>, retries: number): Promise<T> { ... }
```

spec 파일들: 각 `describe` 블록 위에 한 줄 주석 추가.

- [ ] **Step 3: lint 검증**

```bash
bun run lint
```

오류 발생 시 해당 파일 수정 후 재실행.

- [ ] **Step 4: 커밋**

```bash
git add src/shared/
git commit -m "docs: add JSDoc comments to shared/utils, presentation, decorators, dto"
```

---

## Task 4: modules/ 주석 추가

**담당 파일 (45개):**

```
# auth (19개)
src/modules/auth/auth.controller.ts
src/modules/auth/auth.module.ts
src/modules/auth/auth.service.ts
src/modules/auth/auth.service.spec.ts
src/modules/auth/decorators/current-user.decorator.ts
src/modules/auth/decorators/roles.decorator.ts
src/modules/auth/dto/forgot-password.dto.ts
src/modules/auth/dto/login.dto.ts
src/modules/auth/dto/register.dto.ts
src/modules/auth/dto/reset-password.dto.ts
src/modules/auth/dto/subscribe.dto.ts
src/modules/auth/guards/jwt-auth.guard.ts
src/modules/auth/guards/local-auth.guard.ts
src/modules/auth/guards/roles.guard.ts
src/modules/auth/guards/roles.guard.spec.ts
src/modules/auth/strategies/github.strategy.ts
src/modules/auth/strategies/google.strategy.ts
src/modules/auth/strategies/jwt.strategy.ts
src/modules/auth/strategies/local.strategy.ts

# chat (3개)
src/modules/chat/chat.gateway.ts
src/modules/chat/chat.gateway.spec.ts
src/modules/chat/chat.module.ts

# files (6개)
src/modules/files/dto/upload-response.dto.ts
src/modules/files/files.controller.ts
src/modules/files/files.module.ts
src/modules/files/files.service.ts
src/modules/files/files.service.spec.ts
src/modules/files/schemas/file.schema.ts

# health (4개)
src/modules/health/health.controller.ts
src/modules/health/health.module.ts
src/modules/health/health.service.ts
src/modules/health/health.service.spec.ts

# social (4개)
src/modules/social/social.controller.ts
src/modules/social/social.module.ts
src/modules/social/social.service.ts
src/modules/social/social.service.spec.ts

# users (9개)
src/modules/users/constants/permissions.ts
src/modules/users/dto/assign-role.dto.ts
src/modules/users/dto/create-user.dto.ts
src/modules/users/dto/update-user.dto.ts
src/modules/users/roles.controller.ts
src/modules/users/schemas/user.schema.ts
src/modules/users/users.controller.ts
src/modules/users/users.module.ts
src/modules/users/users.service.ts
src/modules/users/users.service.spec.ts
```

- [ ] **Step 1: 파일들 읽기 (모듈별로)**

```bash
# auth
cat src/modules/auth/auth.service.ts
cat src/modules/auth/auth.controller.ts
cat src/modules/auth/guards/jwt-auth.guard.ts
cat src/modules/auth/guards/local-auth.guard.ts
cat src/modules/auth/guards/roles.guard.ts
cat src/modules/auth/strategies/jwt.strategy.ts
cat src/modules/auth/strategies/local.strategy.ts
cat src/modules/auth/strategies/github.strategy.ts
cat src/modules/auth/strategies/google.strategy.ts
cat src/modules/auth/decorators/current-user.decorator.ts
cat src/modules/auth/decorators/roles.decorator.ts
cat src/modules/auth/dto/login.dto.ts
cat src/modules/auth/dto/register.dto.ts
cat src/modules/auth/dto/forgot-password.dto.ts
cat src/modules/auth/dto/reset-password.dto.ts
cat src/modules/auth/dto/subscribe.dto.ts

# chat
cat src/modules/chat/chat.gateway.ts

# files
cat src/modules/files/files.service.ts
cat src/modules/files/files.controller.ts
cat src/modules/files/schemas/file.schema.ts
cat src/modules/files/dto/upload-response.dto.ts

# health
cat src/modules/health/health.service.ts
cat src/modules/health/health.controller.ts

# social
cat src/modules/social/social.service.ts
cat src/modules/social/social.controller.ts

# users
cat src/modules/users/users.service.ts
cat src/modules/users/users.controller.ts
cat src/modules/users/roles.controller.ts
cat src/modules/users/schemas/user.schema.ts
cat src/modules/users/constants/permissions.ts
cat src/modules/users/dto/create-user.dto.ts
cat src/modules/users/dto/update-user.dto.ts
cat src/modules/users/dto/assign-role.dto.ts
```

나머지 모듈, spec 파일도 읽는다.

- [ ] **Step 2: 각 파일에 JSDoc 주석 추가**

공통 규칙에 따라 처리. 주요 기대 결과:

`auth.service.ts`:
```ts
/** 사용자 인증(로그인, 회원가입, 소셜 로그인)과 JWT 토큰 발급을 담당하는 서비스 */
@Injectable()
export class AuthService {
  /** 이메일과 비밀번호로 사용자를 검증한다.
   * @param email 사용자 이메일
   * @param password 평문 비밀번호
   * @returns 검증된 사용자 객체, 실패 시 null
   */
  async validateUser(email: string, password: string): Promise<User | null> { ... }
}
```

`auth.controller.ts`:
```ts
/** 인증 관련 HTTP 엔드포인트(로그인, 회원가입, 소셜 OAuth)를 노출하는 컨트롤러 */
@Controller('auth')
export class AuthController { ... }
```

`jwt-auth.guard.ts`:
```ts
/** Authorization 헤더의 Bearer 토큰을 검증하는 JWT 인증 가드 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') { ... }
```

`local-auth.guard.ts`:
```ts
/** 이메일/비밀번호 자격증명을 검증하는 로컬 인증 가드 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') { ... }
```

`roles.guard.ts`:
```ts
/** @Roles() 데코레이터에 지정된 역할을 사용자가 보유하는지 확인하는 가드 */
@Injectable()
export class RolesGuard implements CanActivate {
  /** 현재 요청 사용자의 역할이 라우트에 요구되는 역할을 포함하는지 확인한다.
   * @param context 현재 실행 컨텍스트
   * @returns 접근 허용 여부
   */
  canActivate(context: ExecutionContext): boolean { ... }
}
```

`jwt.strategy.ts`:
```ts
/** JWT 페이로드를 검증하고 사용자 객체로 변환하는 Passport 전략 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /** JWT 페이로드에서 사용자 정보를 추출하여 반환한다.
   * @param payload JWT 디코딩 결과
   * @returns 인증된 사용자 객체
   */
  async validate(payload: JwtPayload): Promise<User> { ... }
}
```

`local.strategy.ts`:
```ts
/** 이메일과 비밀번호로 사용자를 검증하는 Passport 로컬 전략 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) { ... }
```

`github.strategy.ts`:
```ts
/** GitHub OAuth2를 통해 사용자를 인증하는 Passport 전략 */
@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') { ... }
```

`google.strategy.ts`:
```ts
/** Google OAuth2를 통해 사용자를 인증하는 Passport 전략 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') { ... }
```

`current-user.decorator.ts`:
```ts
/** 현재 인증된 사용자 객체를 컨트롤러 메서드 파라미터로 주입하는 커스텀 데코레이터 */
export const CurrentUser = createParamDecorator(...);
```

`roles.decorator.ts`:
```ts
/** 라우트에 필요한 역할(Role)을 메타데이터로 지정하는 데코레이터 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

`login.dto.ts`:
```ts
/** 로그인 요청 DTO */
export class LoginDto {
  /** 사용자 이메일 주소 */
  @IsEmail()
  email: string;

  /** 평문 비밀번호 */
  @IsString()
  password: string;
}
```

`register.dto.ts`:
```ts
/** 회원가입 요청 DTO */
export class RegisterDto {
  /** 사용자 이름 */
  @IsString()
  name: string;

  /** 이메일 주소 */
  @IsEmail()
  email: string;

  /** 비밀번호 (강도 조건 충족 필요) */
  @IsStrongPassword()
  password: string;
}
```

`chat.gateway.ts`:
```ts
/** WebSocket을 통해 실시간 채팅 메시지를 처리하는 게이트웨이 */
@WebSocketGateway()
export class ChatGateway { ... }
```

`files.service.ts`:
```ts
/** 파일 업로드, 조회, 삭제를 담당하는 서비스 */
@Injectable()
export class FilesService {
  /** 파일을 저장소에 업로드하고 메타데이터를 DB에 저장한다.
   * @param file Multer로 수신한 파일 객체
   * @returns 저장된 파일의 메타데이터
   */
  async upload(file: Express.Multer.File): Promise<FileRecord> { ... }
}
```

`health.service.ts`:
```ts
/** Redis, 큐, 스토리지 연결 상태를 확인하는 헬스 체크 서비스 */
@Injectable()
export class HealthService { ... }
```

`health.controller.ts`:
```ts
/** /health/live 및 /health/ready 엔드포인트를 통해 서비스 상태를 반환하는 컨트롤러 */
@Controller('health')
export class HealthController { ... }
```

`social.service.ts`:
```ts
/** 소셜 로그인(GitHub, Google)을 통해 사용자를 조회하거나 신규 생성하는 서비스 */
@Injectable()
export class SocialService { ... }
```

`users.service.ts`:
```ts
/** 사용자 CRUD 및 역할 관리를 담당하는 서비스 */
@Injectable()
export class UsersService {
  /** 이메일로 사용자를 조회한다.
   * @param email 검색할 이메일 주소
   * @returns 사용자 객체 또는 undefined
   */
  async findByEmail(email: string): Promise<User | undefined> { ... }
}
```

`user.schema.ts` (Drizzle 스키마):
```ts
/** 사용자 테이블 스키마 — 이메일, 비밀번호 해시, 역할 등을 저장한다 */
export const users = pgTable('users', { ... });
```

`permissions.ts`:
```ts
/** 역할별 허용 권한 매핑 상수 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = { ... };
```

spec 파일들: 각 `describe` 블록 위에 한 줄 주석 추가.

- [ ] **Step 3: lint 검증**

```bash
bun run lint
```

오류 발생 시 해당 파일 수정 후 재실행.

- [ ] **Step 4: 커밋**

```bash
git add src/modules/
git commit -m "docs: add JSDoc comments to modules/ files"
```

---

## Task 5: 최종 검증

> Tasks 0–4가 모두 완료된 후 실행한다.

- [ ] **Step 1: lint 전체 검사**

```bash
bun run lint
```

에러가 없어야 한다.

- [ ] **Step 2: 단위 테스트 실행**

```bash
bun run test
```

모든 테스트가 통과해야 한다. 실패 시 해당 spec 파일의 주석이 코드를 변경하지 않았는지 확인.

- [ ] **Step 3: 완료 확인**

```bash
git log --oneline -10
```

Tasks 0–4의 커밋 5개가 보여야 한다.
