# Auth and Users 설계

## 1. 목적

이 문서는 NestJS DDD Bootstrap Project의 Auth Module과 Users Module 설계를 정의한다. Phase 3 Auth와 Phase 4 Users는 데이터 모델과 권한 정책이 강하게 연결되므로 함께 설계한다. 구현 계획은 Users 기반 모델과 Auth/RBAC 흐름으로 분리한다.

## 2. 범위

포함 범위는 다음이다.

- ID/Password 회원가입 및 로그인
- Google OAuth 로그인
- `User + AuthIdentity` 분리 모델
- JWT access token 발급 및 검증
- DB 저장 refresh token 해시와 rotation
- RBAC `USER`, `ADMIN`
- 일반 사용자 `/users/me`
- 관리자 `/users` CRUD, role/status 관리
- 핵심 unit/e2e 테스트

제외 범위는 다음이다.

- 실제 이메일 발송 및 이메일 인증 링크 처리
- refresh token 재사용 감지 시 세션 계열 전체 폐기
- Redis 기반 token/session 저장소
- 세분화 permission 테이블, PBAC, ABAC
- Google 외 OAuth 공급자

## 3. 모듈 경계

`users` 모듈은 서비스 사용자 계정을 소유한다. 사용자 ID, 이메일, 표시 이름, 프로필, 상태, 역할을 관리한다.

`auth` 모듈은 로그인 수단과 인증 세션을 소유한다. Password identity, Google identity, access token, refresh token, 인증/인가 guard가 여기에 속한다.

권장 구조는 다음과 같다.

```text
src/modules/users/
  domain/
  application/
  infrastructure/
  presentation/

src/modules/auth/
  domain/
  application/
  infrastructure/
  presentation/
```

각 모듈은 기존 DDD 규칙을 따른다.

- `domain`: entity, value object, repository port, domain error
- `application`: use case, command/query DTO
- `infrastructure`: Drizzle repository adapter, OAuth/JWT/password hashing adapter
- `presentation`: controller, request/response DTO, guard, decorator

## 4. 도메인 모델

핵심 모델은 `User`, `AuthIdentity`, `RefreshToken`이다.

```text
User
- id
- email
- displayName
- avatarUrl
- bio
- status: active | inactive
- role: USER | ADMIN
- createdAt
- updatedAt

AuthIdentity
- id
- userId
- provider: password | google
- providerUserId
- passwordHash
- emailVerified
- createdAt
- updatedAt

RefreshToken
- id
- userId
- tokenHash
- expiresAt
- revokedAt
- replacedByTokenId
- userAgent
- ipAddress
- createdAt
```

한 사용자는 password identity와 google identity를 동시에 가질 수 있다. 같은 이메일로 Google 로그인했을 때 기존 password User가 있으면, Google profile의 `email_verified`가 true인 경우에만 같은 User에 Google identity를 연결한다.

## 5. DB 스키마

Drizzle schema는 다음 테이블을 포함한다.

- `users`
- `auth_identities`
- `refresh_tokens`

제약 조건은 다음을 적용한다.

- `users.email` unique
- `auth_identities(provider, providerUserId)` unique
- `auth_identities(userId, provider)` unique
- `refresh_tokens.tokenHash` unique

password identity의 `providerUserId`는 이메일 기반 내부 식별자로 통일한다. 비밀번호는 평문 저장을 금지하고 `passwordHash`만 저장한다.

초기 프로필 필드는 `displayName`, `avatarUrl`, `bio`로 제한한다. 사용자가 직접 수정할 수 있는 필드는 이 세 가지뿐이다.

## 6. 인증 흐름

Password 인증 endpoint는 다음이다.

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

`register`는 User와 password identity를 함께 생성한다. 기본 role은 `USER`, 기본 status는 `active`, password identity의 `emailVerified`는 `false`다. 비밀번호 해시는 Argon2id를 사용한다.

`login`은 이메일로 password identity를 찾고 비밀번호 해시를 검증한다. 실패 응답은 이메일 존재 여부와 비밀번호 오류를 구분하지 않는다.

Google OAuth endpoint는 다음이다.

```text
GET /api/v1/auth/google
GET /api/v1/auth/google/callback
```

callback은 Google profile의 `sub`, `email`, `email_verified`, `name`을 사용한다. 기존 Google identity가 있으면 해당 User로 로그인한다. 없으면 검증된 이메일 기준으로 기존 User에 identity를 연결하거나 새 User를 생성한다.

## 7. 토큰과 세션

Access token은 JWT로 발급한다. payload는 다음 필드만 포함한다.

```text
sub: userId
role: USER | ADMIN
sessionId: refreshToken/session 식별자
```

`JwtAuthGuard`는 JWT를 검증한 뒤 User를 조회해 `status=active`인지 확인한다. inactive 사용자는 보호 API에 접근할 수 없다.

Refresh token은 랜덤 토큰을 발급하고 DB에는 해시만 저장한다. `/auth/refresh`는 전달된 token을 해시해 row를 찾고 다음 조건을 확인한다.

```text
revokedAt is null
expiresAt > now
user.status == active
```

성공하면 새 refresh token row를 먼저 만들고, 기존 refresh token row에 `revokedAt`과 `replacedByTokenId=<newRefreshTokenId>`를 기록한다. 폐기된 refresh token은 실패한다.

Auth 구현은 다음 환경 변수를 추가한다.

```text
JWT_ACCESS_TOKEN_SECRET
JWT_ACCESS_TOKEN_EXPIRES_IN
REFRESH_TOKEN_EXPIRES_IN
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL
```

`JWT_ACCESS_TOKEN_EXPIRES_IN`의 기본값은 `15m`, `REFRESH_TOKEN_EXPIRES_IN`의 기본값은 `30d`로 둔다.

## 8. RBAC

기본 역할은 두 개다.

```text
USER
ADMIN
```

인가 구성은 다음을 제공한다.

```text
@Roles('ADMIN')
JwtAuthGuard
RolesGuard
@CurrentUser
```

관리자 Users API는 `ADMIN`만 접근 가능하다. `/users/me`는 인증된 사용자면 접근 가능하다.

## 9. Users API

일반 사용자 API는 다음이다.

```text
GET   /api/v1/users/me
PATCH /api/v1/users/me
```

사용자는 `displayName`, `avatarUrl`, `bio`만 수정할 수 있다. 자신의 `email`, `role`, `status`는 직접 수정할 수 없다.

관리자 API는 다음이다.

```text
GET    /api/v1/users
POST   /api/v1/users
GET    /api/v1/users/:id
PATCH  /api/v1/users/:id
DELETE /api/v1/users/:id
PATCH  /api/v1/users/:id/status
PATCH  /api/v1/users/:id/role
```

`DELETE /users/:id`는 hard delete가 아니라 `status=inactive`으로 변경한다. 목록 API는 pagination과 필터를 지원한다.

```text
GET /users?page=1&limit=20&status=active&role=USER&search=email-or-name
```

## 10. 에러 처리

기존 global exception filter와 response envelope을 유지한다. 도메인 에러는 각 presentation 계층의 mapper가 HTTP 에러로 변환한다.

주요 에러 정책은 다음이다.

- 로그인 실패는 동일한 인증 실패 응답을 사용한다.
- inactive 사용자는 인증 실패 또는 접근 거부로 처리한다.
- 중복 이메일은 명확한 conflict 에러로 처리한다.
- 권한 부족은 forbidden으로 처리한다.
- refresh token 만료, 폐기, 불일치는 동일한 refresh 실패 응답을 사용한다.

## 11. 테스트 전략

테스트는 다음을 포함한다.

- User 도메인 규칙 unit test
- password register/login use case test
- Google OAuth callback use case test, Google client mock 사용
- refresh token rotation test
- RBAC guard test
- `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` e2e test
- `/users/me`, `/users` 관리자 API e2e test
- Drizzle repository PostgreSQL 기반 test

테스트용 factory/fixture는 Users/Auth 흐름에 필요한 최소 범위로 추가한다.

## 12. 구현 분리

구현은 두 단계로 나눈다.

### 12.1 Users 기반 모델

- `users`, `auth_identities`, `refresh_tokens` schema/migration
- Users domain/application/infrastructure/presentation 구조
- User repository port와 Drizzle adapter
- 관리자 Users CRUD
- `/users/me`
- role/status 정책
- password hash adapter 기반 password identity 생성
- 테스트 factory/fixture

### 12.2 Auth/RBAC

- password register/login
- Google OAuth login/callback
- JWT access token 발급/검증
- refresh token DB 저장/rotation
- logout
- `JwtAuthGuard`, `RolesGuard`, `@CurrentUser`, `@Roles`
- Auth Swagger 문서와 e2e 테스트

## 13. 수용 기준

- password 회원가입과 로그인이 동작한다.
- Google OAuth callback이 기존 User 연결 또는 신규 User 생성을 처리한다.
- access token으로 보호 API 접근이 가능하다.
- refresh token rotation이 동작하고 폐기된 token은 실패한다.
- inactive 사용자는 인증에 실패한다.
- ADMIN만 관리자 Users API에 접근 가능하다.
- 일반 사용자는 `/users/me`만 수정 가능하다.
- 핵심 흐름이 unit/e2e 테스트로 검증된다.
