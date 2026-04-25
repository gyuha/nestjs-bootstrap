# NestJS DDD Bootstrap Project PRD

## 1. 문서 개요

- 문서명: NestJS DDD Bootstrap Project PRD
- 문서 목적: 실무형 NestJS 백엔드 부트스트랩 프로젝트의 제품 요구사항과 구현 범위를 정의한다.
- 대상 독자: 백엔드 개발자, 아키텍트, 리뷰어, QA, DevOps
- 문서 상태: Draft

## 2. 제품 개요

NestJS DDD Bootstrap Project는 기능 추가가 쉬운 도메인 주도 개발(DDD) 기반의 모듈러 모놀리식 백엔드 시작점을 제공하는 것을 목표로 한다.

이 프로젝트는 인증, 사용자 관리, 문서화, 테스트, 데이터베이스 연동, 배포, 운영 기본 설정까지 포함한 실무형 템플릿이어야 하며, 새로운 도메인 모듈을 빠르게 추가할 수 있도록 계층 구조와 공통 인프라를 표준화해야 한다.

## 3. 문제 정의

많은 NestJS 초기 프로젝트는 다음과 같은 문제를 가진다.

- 기능이 늘어날수록 계층 분리가 무너지고 파일 구조가 복잡해진다.
- 인증, 권한, 문서화, 테스트, 배포가 프로젝트마다 제각각 구현된다.
- 운영 환경과 로컬/테스트 환경의 데이터베이스 전략이 명확히 분리되지 않는다.
- 도메인 확장 시 공통 규칙이 없어 생산성과 유지보수성이 떨어진다.

본 프로젝트는 위 문제를 해결하기 위해 DDD 기반 구조, 공통 부트스트랩, 운영 친화적 인프라 구성을 기본 제공한다.

## 4. 목표

### 4.1 제품 목표

- NestJS 기반의 실무형 백엔드 시작점을 제공한다.
- DDD 기반 계층 분리로 기능 확장성을 확보한다.
- 인증, 사용자 관리, 문서화, 테스트, 배포까지 기본 구성을 내장한다.
- PostgreSQL, Redis 중심의 운영 친화적 구조를 제공한다.
- SQLite를 활용해 로컬 개발과 경량 테스트를 빠르게 수행할 수 있게 한다.

### 4.2 성공 기준

- 신규 도메인 모듈이 동일한 계층 구조로 일관되게 추가 가능해야 한다.
- 인증 및 사용자 기능이 예제 수준이 아닌 실제 서비스 시작점으로 사용 가능해야 한다.
- 로컬 개발 환경이 문서 기준으로 빠르게 부팅 가능해야 한다.
- Swagger 문서와 테스트 유틸리티가 포함되어 API 개발 생산성을 높여야 한다.
- Docker 기반으로 앱과 의존 서비스 실행 및 헬스체크가 가능해야 한다.

## 5. 비목표

- 마이크로서비스 분리 및 서비스 메시 도입
- 멀티테넌시 구현
- 고급 이벤트 소싱 및 CQRS 전체 도입
- 관리자 대시보드 또는 프론트엔드 UI 제공
- 모든 OAuth 공급자 구현
- 대규모 관측성 플랫폼(APM, 분산 트레이싱 백엔드) 완전 구성

## 6. 주요 사용자

### 6.1 1차 사용자

- NestJS 기반 신규 백엔드 프로젝트를 빠르게 시작하려는 개발자
- DDD 구조를 표준화하고 싶은 팀
- 인증, 사용자 관리, 테스트, 배포 기본기를 포함한 템플릿이 필요한 스타트업 또는 사내 플랫폼 팀

### 6.2 2차 사용자

- 프로젝트 구조와 아키텍처를 검토하는 리뷰어
- 운영 환경 구성을 이어받는 DevOps 엔지니어

## 7. 제품 원칙

- DDD 기반 구조를 유지한다.
- 모듈러 모놀리식 구조를 채택한다.
- 기능별 모듈은 독립적으로 확장 가능해야 한다.
- domain, application, infrastructure, presentation 계층의 책임을 분리한다.
- 공통 기능은 `shared` 영역으로 모아 재사용 가능해야 한다.
- 운영 환경과 로컬/테스트 환경의 인프라 역할을 명확히 분리한다.

## 8. 범위

### 8.1 포함 범위

- NestJS latest, TypeScript latest, pnpm, Biome 기반 초기 프로젝트 구성
- Swagger / OpenAPI 문서화
- Config validation 및 환경 분리
- API versioning
- Drizzle ORM 기반 데이터 접근 계층
- PostgreSQL, SQLite, Redis 연동 전략
- Repository abstraction
- Factories / Seeders / Migrations 체계
- OAuth authentication
- JWT access token 및 Refresh token
- RBAC authorization
- Users CRUD
- 사용자 프로필 / 상태 / 권한 관리
- 공통 응답 포맷 및 표준 에러 처리
- pagination helper, 날짜/암호화/환경설정 유틸
- CORS, Helmet, Rate limiting
- Request logging / trace id
- 테스트용 DB bootstrap 및 mock factory / fixture helpers
- Husky, Commitlint, Conventional Commits
- Dockerfile, docker-compose, multi-stage build, healthcheck, startup migration support

### 8.2 제외 범위

- 프론트엔드 애플리케이션 구현
- 결제, 알림, 파일 업로드 등 부가 도메인 구현
- 복수 운영 리전 및 고가용성 배포 설계

## 9. 기능 요구사항

### 9.1 프로젝트 부트스트랩

- 프로젝트는 최신 NestJS와 TypeScript 기반으로 구성되어야 한다.
- 패키지 매니저 및 실행 환경은 pnpm을 기준으로 해야 한다.
- 코드 포맷팅과 린팅은 Biome으로 통합해야 한다.
- API 버저닝이 기본 활성화되어야 한다.
- Swagger 문서가 개발 환경에서 접근 가능해야 한다.

### 9.2 아키텍처 및 모듈 구조

- 기능은 `modules` 하위의 독립 모듈로 구성되어야 한다.
- 각 모듈은 `domain`, `application`, `infrastructure`, `presentation` 계층을 가져야 한다.
- 공통 계층은 `shared/domain`, `shared/application`, `shared/infrastructure`, `shared/presentation` 구조를 따라야 한다.
- 인프라 구현은 도메인 인터페이스를 침범하지 않아야 한다.

### 9.3 데이터베이스 및 저장소 전략

- PostgreSQL은 메인 운영 DB로 사용해야 한다.
- SQLite는 로컬 개발 및 경량 테스트용 DB로 사용해야 한다.
- Redis는 캐시, 인증 임시 데이터, 추후 확장 가능한 저장소로 사용해야 한다.
- Drizzle ORM을 통해 스키마, 마이그레이션, 리포지토리 구현이 가능해야 한다.
- Repository abstraction을 통해 도메인 계층이 저장소 구현 세부사항에 직접 의존하지 않아야 한다.

### 9.4 인증 및 인가

- OAuth 기반 로그인 흐름을 지원해야 한다.
- JWT access token 발급 및 검증이 가능해야 한다.
- Refresh token 발급, 저장, 재발급 흐름이 포함되어야 한다.
- RBAC 기반 권한 검사가 가능해야 한다.
- 인증/인가 관련 DTO, 가드, 전략, 문서 예제가 포함되어야 한다.

### 9.5 사용자 기능

- Users CRUD API를 제공해야 한다.
- 사용자 프로필 조회 및 수정이 가능해야 한다.
- 사용자 상태(active, inactive 등)와 권한(role) 관리가 가능해야 한다.
- 사용자 관련 도메인 규칙이 애플리케이션 서비스와 분리되어야 한다.

### 9.6 공통 기능

- 표준 응답 포맷을 제공해야 한다.
- 표준 에러 처리 구조를 제공해야 한다.
- pagination helper를 제공해야 한다.
- 날짜, 암호화, 환경설정 관련 공통 유틸을 제공해야 한다.
- Request logging 및 trace id 전파가 가능해야 한다.

### 9.7 테스트

- unit test와 e2e test를 위한 유틸리티가 제공되어야 한다.
- 테스트용 DB bootstrap이 가능해야 한다.
- mock factory 및 fixture helper가 제공되어야 한다.
- 핵심 인증/사용자 흐름을 검증하는 테스트 예제가 포함되어야 한다.

### 9.8 보안 및 운영 설정

- CORS 설정이 가능해야 한다.
- Helmet이 기본 적용되어야 한다.
- Rate limiting이 적용 가능해야 한다.
- Config validation이 환경 변수 로딩 시 수행되어야 한다.
- 환경별 설정이 분리되어야 한다.

### 9.9 개발 워크플로우

- Husky pre-push 단계에서 lint, format, test가 실행되어야 한다.
- Commitlint와 Conventional Commits 규칙이 적용되어야 한다.
- 신규 개발자가 빠르게 실행할 수 있는 기본 문서 또는 스크립트가 제공되어야 한다.

### 9.10 배포

- multi-stage Docker build를 지원해야 한다.
- `docker-compose`로 app, postgres, redis 구성이 가능해야 한다.
- 애플리케이션 healthcheck가 제공되어야 한다.
- 애플리케이션 시작 시 migration 수행 전략이 포함되어야 한다.

## 10. 비기능 요구사항

### 10.1 유지보수성

- 모듈 간 결합도를 낮추고 기능 추가 시 변경 범위를 최소화해야 한다.
- 폴더 구조만으로도 계층 책임이 드러나야 한다.

### 10.2 확장성

- 새로운 도메인 모듈 추가 시 기존 모듈 수정 없이 확장 가능한 구조를 지향해야 한다.
- 향후 외부 인증 공급자, 캐시 정책, 권한 정책 확장이 가능해야 한다.

### 10.3 개발 생산성

- 로컬 개발 환경 기동이 간단해야 한다.
- 테스트/문서화/마이그레이션이 표준화된 명령으로 수행 가능해야 한다.

### 10.4 관측성

- 요청 단위 로그 추적이 가능해야 한다.
- trace id 기반으로 로그 상관관계 확인이 가능해야 한다.

## 11. 기술 제약사항

- 서버 프레임워크는 NestJS를 사용해야 한다.
- 언어는 TypeScript를 사용해야 한다.
- ORM은 Drizzle ORM을 사용해야 한다.
- 운영 DB는 PostgreSQL을 사용해야 한다.
- 로컬 개발/경량 테스트 DB는 SQLite를 사용해야 한다.
- 캐시 및 인증 임시 데이터 저장소는 Redis를 사용해야 한다.
- 런타임/패키지 매니저는 pnpm을 기준으로 해야 한다.
- 코드 품질 도구는 Biome, Husky, Commitlint를 사용해야 한다.

## 12. 권장 폴더 구조

```text
src/
  main.ts
  app.module.ts

  bootstrap/
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
```

## 13. 구현 단계

### Phase 1. Foundation

- NestJS, pnpm, TypeScript, Biome 기반 초기 환경 구성
- Config validation, API versioning, Swagger, 공통 bootstrap 구성
- 공통 응답/에러/로깅/trace id 기반 마련
- PostgreSQL, SQLite, Redis 연결 전략 수립

### Phase 2. Data and Infrastructure

- Drizzle ORM 설정
- 마이그레이션, 시더, 팩토리 기본 체계 구성
- Repository abstraction 및 공통 DB 모듈 설계
- healthcheck 및 docker-compose 기반 의존 서비스 구성

### Phase 3. Auth Module

- OAuth 로그인 흐름 구성
- JWT access token 및 Refresh token 흐름 구현
- RBAC authorization 기본 구성
- 인증 관련 DTO, Swagger 문서, 테스트 추가

### Phase 4. Users Module

- Users CRUD 구현
- 프로필 / 상태 / 권한 관리 구현
- 도메인 규칙, 유스케이스, 리포지토리 구현 분리
- 사용자 관련 테스트 및 문서 추가

### Phase 5. Quality and Delivery

- unit/e2e 테스트 유틸 정리
- Husky, Commitlint, pre-push 검증 파이프라인 설정
- Dockerfile multi-stage build 정리
- startup migration support 및 운영 문서 보강

## 14. 수용 기준

### 14.1 프로젝트 구조

- `auth`, `users` 모듈이 DDD 4계층 구조를 따른다.
- `shared` 영역이 공통 관심사를 분리한다.

### 14.2 데이터 저장소

- PostgreSQL을 운영 DB로 사용 가능한 설정이 존재한다.
- SQLite를 로컬 개발 또는 테스트용으로 사용할 수 있다.
- Redis 연결 및 사용 예제가 포함된다.

### 14.3 인증/인가

- OAuth 인증 진입점이 존재한다.
- JWT access token 발급 및 검증이 동작한다.
- Refresh token 재발급 흐름이 존재한다.
- RBAC 기반 권한 검사 예제가 동작한다.

### 14.4 사용자 기능

- 사용자 생성, 조회, 수정, 삭제 API가 존재한다.
- 사용자 프로필, 상태, 권한 관리 기능이 문서화되어 있다.

### 14.5 운영/품질

- Swagger 문서가 노출된다.
- Config validation이 잘못된 환경 변수에서 실패한다.
- 표준 에러 처리와 공통 응답 포맷이 적용된다.
- 요청 로그와 trace id를 확인할 수 있다.
- lint, format, test가 pre-push에서 실행된다.
- Docker 기반 기동과 healthcheck가 가능하다.

### 14.6 테스트

- unit/e2e 테스트를 위한 기본 실행 구조가 존재한다.
- 테스트용 DB bootstrap과 fixture/factory helper가 존재한다.
- 핵심 인증 및 사용자 흐름에 대한 예제 테스트가 포함된다.

## 15. 리스크 및 오픈 이슈

- OAuth 공급자 범위가 확정되지 않았다.
- Refresh token 저장 전략(DB, Redis, 혼합 방식)에 대한 상세 정책이 필요하다.
- RBAC 역할 체계의 기본값(USER, ADMIN 등) 정의가 필요하다.
- SQLite와 PostgreSQL 간 테스트/운영 스키마 차이를 최소화하는 전략이 필요하다.
- startup migration을 어떤 환경에서 자동 수행할지 정책 정의가 필요하다.

## 16. 향후 확장 방향

- 추가 도메인 모듈(product, billing, notification 등) 확장
- 감사 로그 및 운영 관측성 강화
- 권한 정책 세분화 및 정책 기반 인가(PBAC/ABAC) 확장
- 비동기 이벤트 처리 및 메시징 확장

## 17. 최종 요약

NestJS DDD Bootstrap Project는 단순한 샘플이 아니라, 실제 서비스 출발점으로 사용할 수 있는 백엔드 템플릿을 목표로 한다. 이 프로젝트는 인증, 사용자 관리, 문서화, 테스트, 배포, 운영 기본 설정을 포함하고, PostgreSQL + Redis 중심의 운영 구조와 SQLite 기반의 가벼운 개발/테스트 환경을 함께 제공한다. 또한 DDD 기반 계층 분리와 모듈러 모놀리식 아키텍처를 통해 기능 확장성과 유지보수성을 확보한다.
