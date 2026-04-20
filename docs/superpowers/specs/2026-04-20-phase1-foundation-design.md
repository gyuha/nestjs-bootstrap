# Phase 1 Foundation — 설계 문서

- **날짜**: 2026-04-20
- **범위**: Phase 1 (Foundation)
- **상태**: 승인됨

## 1. 개요

NestJS DDD Bootstrap 프로젝트의 기반을 구성한다. 코드 실행 전 환경 검증, 공통 로깅/보안/문서화 인프라, 공통 응답 포맷을 확립하여 Phase 2~5의 확장 기반을 마련한다.

## 2. 기술 스택

| 항목 | 선택 |
|------|------|
| 런타임/패키지 | Bun |
| 프레임워크 | NestJS 11.x |
| 언어 | TypeScript (strict 모드) |
| 린팅/포맷 | Biome |
| Config 검증 | Zod |
| 로깅 | nestjs-pino + pino-pretty |
| API 버저닝 | Header 기반 (`X-API-Version`) |
| 보안 | Helmet, CORS, @nestjs/throttler |
| 문서화 | Swagger / OpenAPI |

## 3. 폴더 구조

```
nestjs-bootstrap/
├── src/
│   ├── main.ts                        # 앱 진입점, bootstrap 호출
│   ├── app.module.ts                  # 루트 모듈
│   │
│   ├── bootstrap/
│   │   ├── swagger/
│   │   │   └── swagger.setup.ts       # Swagger 초기화 (개발 환경 전용)
│   │   ├── validation/
│   │   │   └── env.schema.ts          # Zod 환경변수 스키마 및 검증
│   │   ├── security/
│   │   │   └── security.setup.ts      # Helmet, CORS, Rate limiting
│   │   └── logging/
│   │       ├── pino.config.ts         # nestjs-pino 설정
│   │       └── trace.middleware.ts    # Trace ID 주입 미들웨어
│   │
│   ├── shared/
│   │   ├── domain/                    # 공통 Value Object, 인터페이스 (Phase 2~)
│   │   ├── application/               # 공통 유스케이스 추상 (Phase 2~)
│   │   ├── infrastructure/            # DB/Redis 연결 모듈 (Phase 2~)
│   │   └── presentation/
│   │       ├── interceptors/
│   │       │   └── transform.interceptor.ts   # 성공 응답 래핑
│   │       ├── filters/
│   │       │   └── exception.filter.ts        # 전역 예외 처리
│   │       └── dto/
│   │           └── api-response.dto.ts        # 공통 응답 타입
│   │
│   └── modules/                       # 도메인 모듈 (Phase 3~4)
│
├── .env.development                   # SQLite 기반 로컬 개발
├── .env.test                          # SQLite 인메모리 테스트
├── .env.production                    # PostgreSQL + Redis 운영
├── .env.example                       # 필수 환경변수 예시
├── biome.json
├── tsconfig.json
└── docker-compose.yml                 # Phase 2에서 완성
```

## 4. Config 검증 (Zod)

앱 시작 시 환경변수를 검증하고, 잘못된 값이 있으면 즉시 실패(fail-fast)한다.

```typescript
// bootstrap/validation/env.schema.ts
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(32),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
});
```

### 환경 파일 전략

| 파일 | 용도 | DATABASE_URL 예시 |
|------|------|-------------------|
| `.env.development` | 로컬 개발 | `file:./dev.db` (SQLite) |
| `.env.test` | 테스트 실행 | `:memory:` (SQLite 인메모리) |
| `.env.production` | 운영 배포 | `postgresql://...` (PostgreSQL) |

## 5. API Versioning

Header 기반 버저닝을 사용한다. URI를 변경하지 않아 RESTful URL을 유지한다.

```typescript
// main.ts
app.enableVersioning({
  type: VersioningType.HEADER,
  header: 'X-API-Version',
  defaultVersion: '1',   // 헤더 미지정 시 v1으로 폴백
});
```

- 기본 버전: `1`
- 컨트롤러에 `@Version('1')` 데코레이터로 버전 명시
- `X-API-Version` 헤더가 없는 요청은 `defaultVersion: '1'`로 폴백 (NestJS 기본 지원)

## 6. Logging & Trace ID

### Pino 설정

```typescript
// bootstrap/logging/pino.config.ts
LoggerModule.forRootAsync({
  useFactory: (config: ConfigService) => ({
    pinoHttp: {
      level: config.get('NODE_ENV') === 'production' ? 'info' : 'debug',
      transport:
        config.get('NODE_ENV') !== 'production'
          ? { target: 'pino-pretty' }  // 로컬: 가독성 좋은 출력
          : undefined,                  // 운영: JSON 원본 출력
    },
  }),
});
```

### Trace ID 흐름

```
요청 수신
  → TraceMiddleware
      └─ X-Trace-Id 헤더 확인
          ├─ 있으면: 해당 값 사용
          └─ 없으면: UUID v4 생성
  → AsyncLocalStorage에 traceId 저장
  → nestjs-pino가 모든 로그에 { traceId } 자동 포함
  → 응답 헤더에 X-Trace-Id 반환
```

### 요청 로그 형식

```json
{
  "level": "info",
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "method": "GET",
  "url": "/health",
  "statusCode": 200,
  "responseTime": 12
}
```

## 7. Swagger

개발 환경에서만 `/docs` 경로에 노출된다.

- Bearer JWT 인증 헤더 전역 등록 (Phase 3 Auth 모듈 대비)
- `X-API-Version` 헤더 파라미터 전역 등록
- 운영 환경(`NODE_ENV=production`)에서는 자동으로 비활성화

## 8. 보안

| 항목 | 구현 | 설명 |
|------|------|------|
| Helmet | `app.use(helmet())` | HTTP 보안 헤더 전체 적용 |
| CORS | `app.enableCors(...)` | `ALLOWED_ORIGINS` 환경변수로 허용 도메인 제어 |
| Rate Limiting | `ThrottlerModule` | 기본 60 req/min/IP, 설정으로 조정 가능 |

## 9. 공통 응답 포맷

모든 API 응답은 동일한 구조를 따른다.

```typescript
// 성공 응답
{ "success": true, "data": { ... } }

// 에러 응답
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "요청 데이터가 올바르지 않습니다.",
    "details": [...]   // 선택적
  }
}
```

- `TransformInterceptor` — 컨트롤러 반환값을 성공 포맷으로 자동 래핑
- `GlobalExceptionFilter` — 모든 예외를 에러 포맷으로 변환
- HTTP 상태코드는 원본 유지

## 10. 구현 순서

1. Bun + NestJS + TypeScript + Biome 초기화
2. Zod 기반 Config 검증 (`bootstrap/validation/`)
3. Pino 로거 + Trace ID 미들웨어 (`bootstrap/logging/`)
4. Helmet + CORS + Rate Limiting (`bootstrap/security/`)
5. Swagger 설정 (`bootstrap/swagger/`)
6. 공통 응답 포맷 + 전역 필터/인터셉터 (`shared/presentation/`)
7. API Versioning 활성화
8. Health check 엔드포인트 (`GET /health`)
9. `.env.*` 파일 및 `.env.example` 작성

## 11. 수용 기준

- [ ] `bun run start:dev` 실행 시 Zod 검증 통과 후 앱 기동
- [ ] 잘못된 환경변수 시 앱 시작 즉시 실패 및 명확한 에러 메시지
- [ ] `GET /health` → `{ "success": true, "data": { "status": "ok" } }`
- [ ] `http://localhost:3000/docs` 에서 Swagger UI 접근 가능
- [ ] 모든 요청 로그에 `traceId` 포함
- [ ] `X-Trace-Id` 응답 헤더 반환 확인
- [ ] Biome lint/format 통과
