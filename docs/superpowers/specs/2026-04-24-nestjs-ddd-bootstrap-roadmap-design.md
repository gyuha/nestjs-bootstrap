# NestJS DDD Bootstrap 실무 시작 템플릿 로드맵 설계

## 1. 개요

이 문서는 `PRD.md`의 전체 요구사항을 한 번에 구현하지 않고, 실무에서 바로 시작점으로 사용할 수 있는 NestJS DDD 부트스트랩 템플릿으로 단계화하기 위한 설계 스펙이다.

1차 MVP의 목표는 단순한 NestJS 샘플 프로젝트가 아니라, 신규 백엔드 서비스를 시작할 때 인증, 사용자 관리, 데이터베이스, 문서화, 기본 테스트를 포함해 바로 확장 가능한 기반을 제공하는 것이다.

## 2. 1차 MVP 범위

### 포함 범위

- NestJS, Bun, TypeScript, Biome 기반 프로젝트 골격
- `domain`, `application`, `infrastructure`, `presentation` 계층을 따르는 DDD 모듈 구조
- SQLite 개발 DB와 PostgreSQL 운영 DB 동등 지원
- 외부 PostgreSQL, 외부 Redis 접속 설정과 healthcheck
- 이메일/비밀번호 기반 로그인
- JWT access token, refresh token 발급과 재발급
- RBAC 기반 인가
- OAuth provider 확장을 위한 추상화
- Users CRUD, 프로필, 상태, 역할 관리
- Swagger, API versioning, config validation
- 표준 응답 포맷, 표준 에러 처리
- auth/users 대표 unit test와 e2e test 예제
- README 실행 가이드와 신규 모듈 추가 규칙

### 제외 범위

- Dockerfile, docker-compose, app 컨테이너 실행 구성
- 실제 OAuth provider 구현
- 관리자 UI, 파일 업로드, 결제, 알림
- 고급 CQRS, Event Sourcing, 멀티테넌시
- APM, 분산 트레이싱 백엔드 같은 완성형 관측성 플랫폼

## 3. 로드맵 접근 방식

로드맵은 수직 슬라이스 기반으로 진행한다. 각 마일스톤은 특정 계층만 완성하는 방식이 아니라, 작은 기능을 API부터 DB와 테스트까지 끝까지 연결해 템플릿의 실제 사용성을 검증한다.

이 접근은 다음 이유로 적합하다.

- DDD 계층 경계를 실제 기능 흐름으로 검증할 수 있다.
- 인증과 사용자 관리가 동작하는 템플릿을 빠르게 확보할 수 있다.
- 새 도메인 모듈을 추가할 때 따라 할 수 있는 예시가 코드로 남는다.
- 과도한 프레임워크화와 추상화를 줄이고 실사용 흐름에 필요한 경계만 만든다.

## 4. 마일스톤

### M0. 프로젝트 기반

NestJS, Bun, TypeScript, Biome 기반 프로젝트를 구성한다. Config validation, Swagger, API versioning, 기본 health endpoint를 포함한다.

완료 기준:

- Bun으로 앱을 설치, 실행, 테스트할 수 있다.
- 개발 환경에서 Swagger 문서에 접근할 수 있다.
- `/health`가 앱 상태를 반환한다.
- 환경 변수 누락 또는 잘못된 값은 부팅 시점에 검증된다.

### M1. DDD·공통 계층

`shared`와 `modules` 구조를 만들고, 표준 응답, 표준 예외 처리, pagination, trace id, request logging의 기본 틀을 둔다.

완료 기준:

- 신규 모듈이 동일한 폴더 규칙으로 추가될 수 있다.
- presentation, application, domain, infrastructure의 역할이 코드 구조로 구분된다.
- 공통 응답과 에러 매핑 규칙이 모든 API에 적용 가능하다.

### M2. 데이터 계층

Drizzle 기반으로 SQLite와 PostgreSQL 설정을 분리한다. users schema, migration, repository abstraction을 구현한다.

완료 기준:

- `DB_CLIENT=sqlite|postgres`로 DB 클라이언트를 선택할 수 있다.
- SQLite와 PostgreSQL 모두 동일한 repository port를 통해 접근한다.
- 개발 환경은 SQLite 파일 DB를 기본값으로 사용할 수 있다.
- 운영 환경은 외부 PostgreSQL 연결 값을 필수로 검증한다.

### M3. Users 수직 슬라이스

Users 기능을 domain, application, infrastructure, presentation 전 계층에 걸쳐 구현한다.

완료 기준:

- 사용자 생성, 조회, 수정, 상태 변경, 역할 변경 API가 제공된다.
- 사용자 도메인 규칙은 domain/application 계층에 위치한다.
- Drizzle repository 구현은 infrastructure 계층에 격리된다.
- Swagger와 대표 테스트 예제로 Users 흐름을 검증할 수 있다.

### M4. Auth 수직 슬라이스

이메일/비밀번호 로그인, JWT access token, refresh token 저장과 재발급, RBAC guard/decorator를 구현한다.

완료 기준:

- 로그인 요청이 사용자 조회, 비밀번호 검증, token pair 발급을 수행한다.
- refresh token은 원문 저장 없이 Redis에 저장하거나 검증 가능한 식별자 기반으로 관리한다.
- refresh token 재발급 시 token rotation을 수행한다.
- 보호 API는 JWT guard로 인증되고 RBAC guard로 role을 검사한다.

### M5. OAuth 확장 포인트

실제 OAuth provider는 구현하지 않고, provider 추가를 위한 port와 adapter 경계를 정의한다.

완료 기준:

- `OAuthProviderPort` 같은 추상화가 존재한다.
- auth application 계층은 구체 provider SDK에 의존하지 않는다.
- Google, GitHub 같은 provider는 후속 마일스톤에서 infrastructure adapter로 추가할 수 있다.

### M6. 테스트·운영 마감

auth/users 대표 테스트와 운영 실행 가이드를 정리한다. Docker 구성은 포함하지 않고, 외부 PostgreSQL/Redis 연결을 전제로 한다.

완료 기준:

- Users application use case 대표 unit test가 있다.
- Auth login/refresh use case 대표 unit test가 있다.
- 회원 또는 사용자 생성, 로그인, 보호 API 접근, refresh 재발급, role 부족 시 `403` 반환 e2e 테스트가 있다.
- `/health`에서 app, DB, Redis 상태를 확인할 수 있다.
- startup migration 전략이 문서화되어 있고 자동 실행 여부는 환경 변수로 제어된다.
- README에 Bun 설치, env 설정, SQLite 개발 실행, 외부 PostgreSQL/Redis 연결, migration, test 명령이 정리된다.

## 5. 아키텍처

전체 구조는 모듈러 모놀리스로 둔다. 기능 모듈은 동일한 4계층을 갖고, 공통 관심사는 `shared`에 둔다.

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
    users/
      domain/
      application/
      infrastructure/
      presentation/
      users.module.ts

    auth/
      domain/
      application/
      infrastructure/
      presentation/
      auth.module.ts
```

### 계층 책임

- `domain`: entity, value object, domain service, repository port, domain error를 둔다. NestJS, Drizzle, HTTP DTO, Config에 의존하지 않는다.
- `application`: use case, command/query DTO, application service, transaction boundary를 둔다. domain port를 사용하며 구현체를 알지 않는다.
- `infrastructure`: Drizzle repository, password hasher, token signer, Redis refresh token store, OAuth adapter 같은 외부 기술 구현을 둔다.
- `presentation`: controller, request/response DTO, guard, decorator, Swagger annotation을 둔다. HTTP 입출력과 application use case 호출만 담당한다.

### 의존성 규칙

- 기본 호출 방향은 `presentation → application → domain`이다.
- `infrastructure`는 domain/application의 port를 구현한다.
- `domain`은 외부 계층, NestJS, Drizzle, HTTP 세부사항을 참조하지 않는다.
- `auth`는 사용자 조회가 필요할 때 `users`의 public application port 또는 exported provider만 사용한다.
- `shared`에는 공통 추상화와 cross-cutting concern만 두고 비즈니스 규칙은 넣지 않는다.

## 6. 데이터 전략

SQLite와 PostgreSQL을 모두 1급 대상으로 지원한다.

- `DB_CLIENT=sqlite|postgres`로 연결 구현을 선택한다.
- users schema는 공통 TypeScript 정의를 기준으로 두고, DB별 migration 산출물과 드라이버 설정만 분리한다.
- DB별 차이가 있는 migration 출력, 드라이버 설정, connection option은 infrastructure 내부에서 분리한다.
- local/development는 SQLite 파일 DB를 기본값으로 둔다.
- test는 isolated SQLite DB를 기본으로 사용한다.
- production은 외부 PostgreSQL URL을 필수로 검증한다.
- repository port는 domain/application에 두고 Drizzle 구현은 infrastructure에 둔다.

## 7. 인증과 인가 전략

1차 인증은 이메일/비밀번호 기반으로 완성한다.

### 로그인 흐름

1. 사용자 생성 시 password hash를 저장한다.
2. 로그인 요청에서 user lookup을 수행한다.
3. password hasher로 비밀번호를 검증한다.
4. access token과 refresh token을 발급한다.
5. refresh token은 원문 저장 없이 Redis에 저장하거나 검증 가능한 식별자 기반으로 관리한다.
6. refresh 요청은 Redis 저장값과 요청 token을 검증한 뒤 token rotation을 수행한다.
7. 보호 API는 JWT guard로 인증하고 RBAC guard로 role을 검사한다.

### OAuth 확장

OAuth는 실제 provider 없이 확장 구조만 포함한다. application 계층은 provider 공통 계약만 알고, 구체 provider 연동은 infrastructure adapter로 추가한다.

## 8. 에러 처리 기준

도메인과 애플리케이션 오류는 표준 HTTP 오류로 매핑한다.

- 잘못된 자격 증명은 `401 Unauthorized`로 응답한다.
- 만료되거나 위조된 token은 `401 Unauthorized`로 응답한다.
- role 부족은 `403 Forbidden`으로 응답한다.
- 중복 이메일은 conflict 계열 오류로 응답한다.
- 사용자 없음은 대상 API의 의미에 맞게 not found 또는 인증 실패로 매핑한다.
- 외부 PostgreSQL 또는 Redis 연결 실패는 `/health`에서 명시적으로 노출한다.

## 9. 테스트 전략

테스트는 핵심 예제 중심으로 유지한다. 목표는 모든 케이스를 촘촘히 덮는 것이 아니라, 새 도메인 추가 시 따라 할 수 있는 대표 패턴을 제공하는 것이다.

### Unit test

- Users application use case 대표 테스트
- Auth login use case 대표 테스트
- Auth refresh use case 대표 테스트
- password hasher, token service 같은 infrastructure adapter의 핵심 동작 테스트

### E2E test

- 회원 또는 사용자 생성 후 로그인
- 로그인 후 보호 API 접근
- refresh token 재발급
- role 부족 시 `403 Forbidden` 반환

## 10. 운영과 문서화

Docker 구성은 1차 MVP에서 제외한다. 운영 환경은 이미 준비된 외부 PostgreSQL과 Redis에 접속하는 전제를 따른다.

운영 기준:

- 외부 PostgreSQL 연결 값은 production에서 필수다.
- 외부 Redis 연결 값은 auth refresh token 저장을 위해 필수다.
- `/health`는 app, DB, Redis 상태를 반환한다.
- startup migration은 환경 변수로 자동 실행 여부를 제어한다.
- 운영에서는 migration을 앱 부팅 자동 실행보다 명시적 배포 단계에서 실행하는 방식을 권장한다.

문서화 기준:

- README에 Bun 설치와 기본 명령을 정리한다.
- README에 env 파일 구성과 필수 환경 변수를 정리한다.
- README에 SQLite 개발 실행 방법을 정리한다.
- README에 외부 PostgreSQL/Redis 연결 방법을 정리한다.
- README에 migration, seed, test 명령을 정리한다.
- README 또는 별도 문서에 신규 모듈 추가 규칙과 계층 의존성 규칙을 정리한다.

## 11. 개발 워크플로우

- Biome으로 format과 lint를 통합한다.
- Husky pre-push에서 lint와 test를 실행한다.
- Commitlint와 Conventional Commits 규칙을 적용한다.
- 변경이 작을수록 수직 슬라이스 단위로 완료하고 검증한다.

## 12. 성공 기준

1차 MVP는 다음 조건을 만족하면 완료로 본다.

- 신규 개발자가 문서만 보고 로컬 SQLite 환경으로 앱을 실행할 수 있다.
- 외부 PostgreSQL과 Redis 연결 값으로 운영 유사 환경을 실행할 수 있다.
- Users CRUD와 Auth login/refresh/RBAC 흐름이 동작한다.
- Swagger에서 주요 API를 확인할 수 있다.
- 대표 unit/e2e 테스트가 템플릿 사용법을 보여준다.
- 신규 도메인 모듈이 동일한 계층 구조와 의존성 규칙으로 추가될 수 있다.
