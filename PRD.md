# NestJS DDD Bootstrap Project PRD

## 1. 문서 개요

- 문서명: NestJS DDD Bootstrap Project PRD
- 문서 목적: 실무형 NestJS 백엔드 부트스트랩 프로젝트의 제품 요구사항과 구현 범위를 기술 결정까지 포함해 정의한다.
- 문서 성격: 구현 지시서에 가까운 기술 고정형 PRD
- 대상 독자: 백엔드 개발자, 아키텍트, 리뷰어, QA, DevOps
- 문서 상태: Draft

## 2. 제품 개요

NestJS DDD Bootstrap Project는 기능 추가가 쉬운 도메인 주도 개발(DDD) 기반의 모듈러 모놀리식 백엔드 시작점을 제공한다.

이 프로젝트는 인증, 사용자 관리, 권한 관리, 문서화, 테스트, 데이터베이스 연동, 운영 기본 설정까지 포함한 실무형 템플릿이어야 한다. 새로운 도메인 모듈을 빠르게 추가할 수 있도록 계층 구조와 공통 인프라를 표준화한다.

본 PRD는 구현자가 별도 기술 선택 논의 없이 작업 범위를 판단할 수 있도록 주요 기술 스택, 모듈 경계, 환경 전략, 필수 API, 테스트 범위를 명확히 고정한다.

## 3. 문제 정의

많은 NestJS 초기 프로젝트는 다음 문제를 가진다.

- 기능이 늘어날수록 계층 분리가 무너지고 파일 구조가 복잡해진다.
- 인증, 권한, 문서화, 테스트, 배포 준비가 프로젝트마다 제각각 구현된다.
- 운영 환경과 로컬/테스트 환경의 데이터베이스 전략이 명확히 분리되지 않는다.
- 도메인 확장 시 공통 규칙이 없어 생산성과 유지보수성이 떨어진다.
- 권한 모델이 단순 enum으로 시작해 실제 서비스 요구가 생길 때 마이그레이션 비용이 커진다.

본 프로젝트는 DDD 기반 구조, 공통 부트스트랩, 인증/사용자/권한 기본 도메인, 운영 친화적 설정을 기본 제공하여 위 문제를 해결한다.

## 4. 목표

### 4.1 제품 목표

- NestJS 기반의 실무형 백엔드 시작점을 제공한다.
- DDD 기반 계층 분리로 기능 확장성을 확보한다.
- 인증, 사용자 관리, 확장형 RBAC, 문서화, 테스트, 운영 기본 설정을 내장한다.
- PostgreSQL과 Redis 외부 서버에 연결 가능한 운영 구조를 제공한다.
- SQLite를 활용해 로컬 개발과 테스트를 빠르게 수행할 수 있게 한다.
- pnpm, Biome, Husky, Commitlint 기반 개발 워크플로우를 표준화한다.

### 4.2 성공 기준

- 신규 도메인 모듈을 동일한 계층 구조로 일관되게 추가할 수 있어야 한다.
- 인증, 사용자, 권한 기능이 예제 수준이 아니라 실제 서비스 시작점으로 사용 가능해야 한다.
- 로컬 개발 환경이 SQLite와 in-memory adapter 기준으로 빠르게 부팅되어야 한다.
- 운영 환경은 외부 PostgreSQL과 Redis 연결 설정만으로 실행 가능해야 한다.
- Swagger 문서와 테스트 유틸리티가 포함되어 API 개발 생산성을 높여야 한다.
- 핵심 흐름에 대한 unit/e2e 테스트가 제공되어 변경 안전성을 확보해야 한다.

## 5. 비목표

- 마이크로서비스 분리 및 서비스 메시 도입
- 멀티테넌시 구현
- 고급 이벤트 소싱 및 CQRS 전체 도입
- 관리자 대시보드 또는 프론트엔드 UI 제공
- Google 외 OAuth 공급자 구현
- 결제, 알림, 파일 업로드 등 부가 도메인 구현
- 대규모 관측성 플랫폼(APM, 분산 트레이싱 백엔드) 완전 구성
- Dockerfile, docker-compose, 컨테이너 기반 로컬 인프라 구성
- PostgreSQL 또는 Redis 서버 자체의 설치/운영 자동화

## 6. 주요 사용자

### 6.1 1차 사용자

- NestJS 기반 신규 백엔드 프로젝트를 빠르게 시작하려는 개발자
- DDD 구조를 표준화하고 싶은 팀
- 인증, 사용자 관리, 권한 관리, 테스트, 운영 기본기를 포함한 템플릿이 필요한 스타트업 또는 사내 플랫폼 팀

### 6.2 2차 사용자

- 프로젝트 구조와 아키텍처를 검토하는 리뷰어
- 운영 환경 구성을 이어받는 DevOps 엔지니어
- QA 및 테스트 자동화를 설계하는 엔지니어

## 7. 제품 원칙

- DDD 기반 계층 구조를 유지한다.
- 모듈러 모놀리식 구조를 채택한다.
- 기능별 모듈은 독립적으로 확장 가능해야 한다.
- `domain`, `application`, `infrastructure`, `presentation` 계층의 책임을 분리한다.
- 공통 기능은 `shared` 영역으로 모아 재사용 가능하게 한다.
- 운영 환경과 로컬/테스트 환경의 인프라 역할을 명확히 분리한다.
- 도메인 계층은 ORM, Redis, OAuth client 등 인프라 세부 구현에 직접 의존하지 않는다.
- 기본 구현은 단순해야 하지만 권한, 저장소, 캐시, 인증 공급자는 확장 가능해야 한다.

## 8. 기술 스택

### 8.1 필수 기술

- Runtime: Node.js LTS
- Framework: NestJS latest
- Language: TypeScript latest
- Package manager: pnpm
- Lint/format: Biome
- ORM: Drizzle ORM
- Local/test DB: SQLite
- Production DB: 외부 PostgreSQL 서버
- Production cache/token store: 외부 Redis 서버
- API documentation: Swagger / OpenAPI
- Test framework: NestJS 표준 테스트 구성 기반 unit/e2e test
- Git hooks: Husky
- Commit policy: Commitlint, Conventional Commits

## 9. 범위

### 9.1 포함 범위

- NestJS, TypeScript, pnpm, Biome 기반 초기 프로젝트 구성
- Swagger / OpenAPI 문서화
- Config validation 및 환경 분리
- API versioning
- SQLite 기반 로컬 개발 DB
- SQLite 기반 테스트 DB bootstrap
- 운영 환경의 외부 PostgreSQL 연결
- 운영 환경의 외부 Redis 연결
- development/test 환경의 in-memory cache/token adapter
- Drizzle ORM 기반 schema, migration, repository 구현
- Repository abstraction
- Factories / Seeders / Migrations 체계
- Google OAuth authentication
- JWT access token 및 refresh token
- 확장형 RBAC authorization
- Users CRUD 및 내 프로필 관리
- 표준 응답 포맷 및 표준 에러 처리
- pagination helper, 날짜/암호화/환경설정 유틸
- CORS, Helmet, rate limiting
- request logging 및 trace id
- 테스트용 DB bootstrap, mock factory, fixture helper
- Git hooks, Commitlint, Conventional Commits
- Healthcheck endpoint
- startup migration 실행 전략
- README 기반 빠른 시작 문서

### 9.2 제외 범위

- 프론트엔드 애플리케이션 구현
- 관리자 대시보드 구현
- 결제, 알림, 파일 업로드 등 부가 도메인 구현
- 복수 운영 리전 및 고가용성 배포 설계
- 컨테이너 이미지 빌드 및 컨테이너 오케스트레이션 구성
- PostgreSQL/Redis 서버 프로비저닝

## 10. 환경 전략

### 10.1 환경 파일

다음 환경 파일을 기준으로 설정을 분리한다.

```text
.env.development
.env.development.local
.env.test
.env.production
.env.production.local
```

`.local` 파일은 개인 또는 서버별 민감 설정 오버라이드 용도로 사용한다. 저장소에는 예시 파일만 제공하고 실제 secret은 커밋하지 않는다.

### 10.2 환경별 인프라

| 환경 | DB | Cache/token adapter | 목적 |
| --- | --- | --- | --- |
| development | SQLite | in-memory | 빠른 로컬 개발 |
| test | SQLite | in-memory | 독립적이고 빠른 자동 테스트 |
| production | 외부 PostgreSQL | 외부 Redis | 실제 운영 |

운영 환경에서 PostgreSQL과 Redis는 이미 별도 서버가 존재한다고 전제한다. 애플리케이션은 연결 URL, credential, TLS 여부, timeout 등 연결 설정만 제공한다.

### 10.3 설정 검증

- 애플리케이션 시작 시 필수 환경 변수를 검증해야 한다.
- production 환경에서 PostgreSQL/Redis 연결 설정이 누락되면 시작에 실패해야 한다.
- development/test 환경에서는 Redis 설정이 없어도 in-memory adapter로 동작해야 한다.
- Google OAuth client 설정은 인증 기능 사용 환경에서 필수로 검증한다.

## 11. 아키텍처 및 모듈 구조

### 11.1 기본 구조

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
    versioning/

  shared/
    domain/
    application/
    infrastructure/
    presentation/

  modules/
    auth/
      domain/
      application/
      infrastructure/
      presentation/
      auth.module.ts

    users/
      domain/
      application/
      infrastructure/
      presentation/
      users.module.ts

    access-control/
      domain/
      application/
      infrastructure/
      presentation/
      access-control.module.ts
```

### 11.2 계층 책임

- `domain`: entity, value object, domain rule, repository interface를 포함한다.
- `application`: use case, application service, command/query DTO, transaction 경계를 담당한다.
- `infrastructure`: Drizzle repository 구현, OAuth client, Redis adapter, crypto 구현, 외부 시스템 연동을 포함한다.
- `presentation`: controller, request/response DTO, guard, decorator, Swagger 문서화를 포함한다.
- `shared`: 공통 응답, 에러, pagination, config, logging, crypto, test helper를 포함한다.

### 11.3 필수 모듈

- `auth`: Google OAuth, JWT, refresh token, logout, 인증 guard를 담당한다.
- `users`: 사용자 CRUD, 프로필, 상태 관리, 사용자 조회를 담당한다.
- `access-control`: role, permission, role-permission mapping, user-role mapping, 권한 guard를 담당한다.

`access-control`은 `auth` 내부 구현으로 숨기지 않는다. 권한 모델은 독립 도메인으로 확장 가능해야 한다.

## 12. 데이터베이스 및 저장소 요구사항

### 12.1 Drizzle ORM

- Drizzle ORM을 통해 schema, migration, seed를 관리한다.
- SQLite와 PostgreSQL을 모두 지원하는 schema 전략을 제공한다.
- DB별 차이가 필요한 경우 infrastructure 계층에서 분리한다.
- application/domain 계층은 Drizzle 타입이나 query builder에 직접 의존하지 않는다.

### 12.2 Repository abstraction

- 도메인 계층은 repository interface만 참조한다.
- Drizzle 기반 repository 구현은 infrastructure 계층에 둔다.
- 테스트에서는 in-memory repository 또는 mock repository를 사용할 수 있어야 한다.

### 12.3 Migration / seed

- `db:migrate` 명령으로 migration을 실행할 수 있어야 한다.
- `db:seed` 명령으로 기본 데이터를 생성할 수 있어야 한다.
- seed는 최소한 다음 데이터를 생성한다.
  - 기본 역할: `admin`, `user`
  - 기본 권한 세트
  - role-permission mapping
  - 선택 가능한 관리자 사용자
  - 테스트 사용자 fixture

## 13. 인증 요구사항

### 13.1 Google OAuth

- Google OAuth 로그인 흐름을 지원해야 한다.
- OAuth callback을 처리해야 한다.
- 최초 로그인 시 사용자 자동 생성 또는 기존 사용자 연결이 가능해야 한다.
- OAuth provider identity와 내부 user는 분리 저장해야 한다.
- Google 외 OAuth 공급자는 구현하지 않지만 provider 확장 구조는 남긴다.

### 13.2 JWT / refresh token

- JWT access token 발급 및 검증이 가능해야 한다.
- refresh token 발급, 저장, 재발급, 폐기 흐름을 제공해야 한다.
- logout 시 refresh token을 무효화해야 한다.
- production 환경에서는 refresh token 또는 token metadata 저장에 Redis를 사용할 수 있어야 한다.
- development/test 환경에서는 in-memory adapter로 동일 인터페이스를 제공해야 한다.

### 13.3 인증 presentation

- 인증 guard를 제공해야 한다.
- current user decorator를 제공해야 한다.
- Swagger에 인증 API와 bearer token 사용법을 문서화해야 한다.

## 14. 사용자 요구사항

- Users CRUD API를 제공해야 한다.
- 내 프로필 조회 및 수정 API를 제공해야 한다.
- 사용자 상태를 관리할 수 있어야 한다.
- 필수 사용자 상태는 `active`, `inactive`, `suspended`이다.
- 사용자 이메일은 고유해야 한다.
- 사용자 삭제는 기본적으로 hard delete가 아니라 비활성화로 처리한다.
- 사용자 상태 변경과 역할 변경은 권한이 있는 사용자만 수행할 수 있어야 한다.
- 사용자 관련 도메인 규칙은 application service와 분리되어야 한다.

## 15. RBAC 요구사항

### 15.1 데이터 모델

확장형 RBAC를 필수로 구현한다.

- `roles`
- `permissions`
- `role_permissions`
- `user_roles`

역할과 권한은 enum 고정이 아니라 DB 기반 확장 구조로 관리한다.

### 15.2 권한 검사

- 권한 검사 decorator를 제공해야 한다.
- 권한 guard를 제공해야 한다.
- controller 단위와 handler 단위 권한 선언이 가능해야 한다.
- admin 역할은 사용자 상태와 역할을 관리할 수 있어야 한다.
- 일반 user 역할은 자신의 프로필 조회/수정 권한만 기본으로 가진다.

## 16. 공통 기능 요구사항

- 표준 응답 포맷을 제공해야 한다.
- 표준 에러 처리 구조를 제공해야 한다.
- validation error를 일관된 포맷으로 반환해야 한다.
- pagination helper를 제공해야 한다.
- 날짜, 암호화, 환경설정 관련 공통 유틸을 제공해야 한다.
- request logging을 제공해야 한다.
- 요청별 trace id를 생성하고 응답 헤더로 전파해야 한다.
- API versioning을 기본 활성화해야 한다.
- Swagger 문서는 development 환경에서 접근 가능해야 한다.

## 17. 보안 및 운영 요구사항

- CORS 설정이 가능해야 한다.
- Helmet이 기본 적용되어야 한다.
- rate limiting이 적용 가능해야 한다.
- config validation이 환경 변수 로딩 시 수행되어야 한다.
- healthcheck endpoint를 제공해야 한다.
- startup migration 실행 전략을 제공해야 한다.
- PostgreSQL 또는 Redis 연결 실패 시 명확한 startup/runtime error를 제공해야 한다.
- 민감 정보는 로그에 노출하지 않아야 한다.

## 18. 테스트 요구사항

- unit test와 e2e test 명령을 제공해야 한다.
- SQLite 기반 테스트 DB bootstrap이 가능해야 한다.
- mock factory와 fixture helper를 제공해야 한다.
- Auth 핵심 흐름 테스트를 포함해야 한다.
- Users CRUD 테스트를 포함해야 한다.
- RBAC guard와 주요 use case 테스트를 포함해야 한다.
- config validation 실패 테스트를 포함해야 한다.
- 테스트는 외부 PostgreSQL/Redis 서버 없이 기본 실행 가능해야 한다.

## 19. 개발 워크플로우 요구사항

### 19.1 pnpm scripts

다음 명령을 제공해야 한다.

```text
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm format
pnpm test
pnpm test:e2e
pnpm db:migrate
pnpm db:seed
```

### 19.2 품질 게이트

- Biome으로 lint와 format을 통합한다.
- Husky pre-push 단계에서 lint, format check, test를 실행한다.
- Commitlint와 Conventional Commits 규칙을 적용한다.

### 19.3 문서

README에는 다음 내용을 포함해야 한다.

- 빠른 시작
- 환경 변수 설정
- SQLite 개발 DB 사용법
- 외부 PostgreSQL/Redis 연결 방법
- Google OAuth 설정 방법
- migration 및 seed 실행법
- 테스트 실행법
- 신규 도메인 모듈 추가 규칙

## 20. 비기능 요구사항

### 20.1 유지보수성

- 모듈 간 결합도를 낮추고 기능 추가 시 변경 범위를 최소화해야 한다.
- 폴더 구조만으로도 계층 책임이 드러나야 한다.
- domain/application 계층은 infrastructure 세부 구현에서 독립적이어야 한다.

### 20.2 확장성

- 새로운 도메인 모듈 추가 시 기존 모듈 수정 없이 확장 가능한 구조를 지향해야 한다.
- 향후 OAuth 공급자, 캐시 정책, 권한 정책 확장이 가능해야 한다.
- RBAC는 역할/권한 추가가 DB 데이터 변경만으로 가능해야 한다.

### 20.3 개발 생산성

- 로컬 개발 환경 기동이 간단해야 한다.
- 테스트, 문서화, 마이그레이션, 시드가 표준 명령으로 수행 가능해야 한다.
- 외부 PostgreSQL/Redis 없이도 기본 개발과 테스트가 가능해야 한다.

### 20.4 관측성

- 요청 단위 로그 추적이 가능해야 한다.
- trace id 기반으로 로그 상관관계 확인이 가능해야 한다.
- 운영 장애 시 설정 누락, DB 연결 실패, Redis 연결 실패를 구분할 수 있어야 한다.

## 21. 향후 확장 방향

- 추가 도메인 모듈 확장
- 감사 로그 및 운영 관측성 강화
- 권한 정책 세분화
- Google 외 OAuth provider 추가
- 비동기 이벤트 처리 및 메시징 확장
