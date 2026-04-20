# Phase 3: Auth Module — 설계 문서

- **날짜**: 2026-04-21
- **범위**: Phase 3 (Authentication & Authorization)
- **상태**: 승인됨

## 1. 개요

이메일/비밀번호 회원가입 및 로그인, Google/GitHub 소셜 로그인, JWT 기반 인증, Refresh Token 순환, 완전한 RBAC(역할/권한 관리)를 구현한다.

## 2. 기술 스택

| 항목 | 선택 |
|------|------|
| 비밀번호 해싱 | argon2 |
| 인증 프레임워크 | Passport.js (`passport-local`, `passport-jwt`, `passport-google-oauth20`, `passport-github2`) |
| JWT | `@nestjs/jwt` |
| Refresh Token 저장소 | Redis (Phase 2 인프라 활용) |
| 권한 정의 | 코드 문자열 리터럴 (Enum/const) |
| 모듈 구조 | 모듈 분리 (AuthModule + UsersModule + SocialModule) |

## 3. 모듈 구조

```
src/modules/
├── auth/                 # JWT 발급/검증, login/logout, register
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/
│   │   ├── jwt.strategy.ts
│   │   ├── local.strategy.ts
│   │   ├── google.strategy.ts
│   │   └── github.strategy.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   ├── roles.guard.ts
│   │   └── optional-jwt.guard.ts
│   ├── decorators/
│   │   ├── roles.decorator.ts
│   │   └── current-user.decorator.ts
│   └── dto/
│       ├── login.dto.ts
│       ├── register.dto.ts
│       └── refresh-token.dto.ts
│
├── users/               # User CRUD, Role/Permission 관리 (Admin용)
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── schemas/
│   │   ├── user.schema.ts
│   │   ├── role.schema.ts
│   │   └── social-account.schema.ts
│   └── dto/
│       ├── create-user.dto.ts
│       ├── update-user.dto.ts
│       └── assign-role.dto.ts
│
└── social/              # 소셜 로그인 콜백 처리
    ├── social.controller.ts
    └── social.service.ts
```

## 4. 데이터 모델 (Drizzle Schema)

### users

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| email | text | unique, not null |
| passwordHash | text | nullable (소셜 로그인 시 null) |
| isActive | boolean | default true |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### roles

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| name | text | unique (user, admin) |
| description | text | |

### user_roles

| 컬럼 | 타입 | 설명 |
|------|------|------|
| userId | uuid | FK → users.id |
| roleId | uuid | FK → roles.id |

### role_permissions

| 컬럼 | 타입 | 설명 |
|------|------|------|
| roleId | uuid | FK → roles.id |
| permission | text | 코드 정의 문자열 |

### social_accounts

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| userId | uuid | FK → users.id |
| provider | text | 'google' or 'github' |
| providerId | text | 소셜 플랫폼 사용자 ID |
| createdAt | timestamp | |

## 5. Permission 정의 (코드 리터럴)

```typescript
// src/modules/users/constants/permissions.ts
export const Permissions = {
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  USERS_DELETE: 'users:delete',
  ROLES_MANAGE: 'roles:manage',
  AUTH_ADMIN: 'auth:admin',
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];
```

## 6. 기본 역할

| 역할 | 권한 |
|------|------|
| user | 없음 (인증만) |
| admin | 전체 권한 |

## 7. API 엔드포인트

### Auth (토큰 관리)

| Method | Path | Guard | 설명 |
|--------|------|-------|------|
| POST | /auth/register | - | 이메일/비밀번호 회원가입 |
| POST | /auth/login | Local | 로그인 → access + refresh token |
| POST | /auth/logout | JWT | refresh token 삭제 |
| POST | /auth/refresh | - | refresh token으로 access token 갱신 |
| GET | /auth/google | - | Google OAuth 시작 |
| GET | /auth/google/callback | - | Google OAuth 콜백 |
| GET | /auth/github | - | GitHub OAuth 시작 |
| GET | /auth/github/callback | - | GitHub OAuth 콜백 |
| GET | /auth/me | JWT | 현재 사용자 정보 |

### Users (Admin, RBAC 보호)

| Method | Path | Permission | 설명 |
|--------|------|-------------|------|
| GET | /users | users:read | 사용자 목록 |
| POST | /users | users:write | 사용자 생성 |
| GET | /users/:id | users:read | 사용자 상세 |
| PATCH | /users/:id | users:write | 사용자 수정 |
| DELETE | /users/:id | users:delete | 사용자 삭제 |

### Roles (Admin, RBAC 보호)

| Method | Path | Permission | 설명 |
|--------|------|-------------|------|
| GET | /roles | roles:manage | 역할 목록 |
| POST | /roles | roles:manage | 역할 생성 |
| GET | /roles/:id | roles:manage | 역할 상세 |
| PATCH | /roles/:id | roles:manage | 역할 수정 |
| DELETE | /roles/:id | roles:manage | 역할 삭제 |
| POST | /roles/:id/permissions | roles:manage | 권한 할당/해제 |

## 8. 토큰 전략

### Access Token (JWT)

- Payload: `{ sub: userId, email, roles: string[] }`
- 만료: 30분
- 서명: HS512, `JWT_SECRET` 환경변수

### Refresh Token

- 저장소: Redis
- Key 패턴: `refresh:${userId}:${tokenVersion}`
- TTL: 7일
- httpOnly 쿠키로 클라이언트 전송
- Rotation: 사용 시 새 refresh token 발급,古い token 삭제

### Refresh Token Rotation 플로우

```
1. 사용자가 /auth/login → access + refresh token 발급
2. Refresh token은 httpOnly 쿠키로 전송
3. /auth/refresh 호출 시:
   a. Redis에서旧 token 검증
   b. 새 access token 발급
   c. 새 refresh token 발급 (rotation)
   d. Redis에서旧 token 삭제, 새 token 저장
```

## 9. 소셜 로그인 플로우

### Google OAuth

```
GET /auth/google
  → Passport Google Strategy 리다이렉트
  → Google 로그인 페이지
  → /auth/google/callback?code=xxx
  → 사용자 정보 조회/생성
  → 기존 계정 연동 또는 신규 생성
  → access + refresh token 발급
```

### GitHub OAuth

```
GET /auth/github
  → Passport GitHub Strategy 리다이렉트
  → GitHub 로그인/인가 페이지
  → /auth/github/callback?code=xxx
  → 사용자 정보 조회/생성
  → 기존 계정 연동 또는 신규 생성
  → access + refresh token 발급
```

### 소셜 계정 연동

- 동일 이메일의 기존 계정이 있으면 소셜 계정만 연동 (passwordHash는 null 유지)
- 다른 이메일의 소셜 계정이 이미 있으면 연동 불가 (이메일 충돌 에러)

## 10. Guards & Decorators

### JwtAuthGuard

- Access token Bearer 헤더에서 추출
- Passport JWT Strategy 사용

### RolesGuard

- `@Roles(...permissions)` 데코레이터와 함께 사용
- JWT payload의 roles 배열과 필요한 권한比对

### @Roles(...permissions) Decorator

```typescript
@Post()
@Roles(Permissions.USERS_WRITE)
async create(@Body() dto: CreateUserDto) { }
```

### @CurrentUser() Decorator

```typescript
@Get('me')
async me(@CurrentUser() user: AuthUser) { }
```

## 11. 환경변수 추가

```env
# JWT
JWT_SECRET=           # min 64 chars for HS512
JWT_ACCESS_TTL=1800  # 30 minutes in seconds
JWT_REFRESH_TTL=604800 # 7 days in seconds

# OAuth - Google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# OAuth - GitHub
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Redis (already in Phase 2)
REDIS_URL=redis://localhost:6379
```

## 12. 기존 인프라 활용

- **DatabaseModule (Phase 2)**: UsersModule의 Drizzle 스키마가 `database.module.ts`의 DRIZZLE_CLIENT를 사용
- **CacheModule (Phase 2)**: Refresh token Redis 저장은 AuthModule에서 직접 Redis client 사용 (CacheService는 TTL 기반简易 wrapper라서 refresh token에 부적합)
- **HealthModule (Phase 2)**: 변경 없음

## 13. 구현 순서

1. 패키지 설치 (argon2, passport, jwt, google oauth, github oauth)
2. UsersModule (스키마, CRUD) — 다른 모듈의 기반
3. AuthModule (기본 login/register, argon2, JWT)
4. Refresh token Redis 저장소
5. Roles/Permission CRUD + RolesGuard
6. Google OAuth
7. GitHub OAuth
8. e2e 테스트

## 14. 수용 기준

- [ ] `POST /auth/register` → argon2 해싱된 비밀번호 저장
- [ ] `POST /auth/login` → access + refresh token 반환 (httpOnly 쿠키)
- [ ] `POST /auth/refresh` → 새 access token 발급, rotation
- [ ] `POST /auth/logout` → Redis에서 refresh token 삭제
- [ ] `GET /auth/google` → Google OAuth 리다이렉트
- [ ] `GET /auth/google/callback` → JWT 발급, 기존 계정 연동
- [ ] `GET /auth/github` → GitHub OAuth 리다이렉트
- [ ] `GET /auth/github/callback` → JWT 발급, 기존 계정 연동
- [ ] `GET /users` → users:read 권한 필요
- [ ] `POST /users` → users:write 권한 필요
- [ ] `POST /roles` → roles:manage 권한 필요
- [ ] `POST /roles/:id/permissions` → 권한 할당
- [ ] Refresh token Redis TTL 7일
- [ ] Access token 30분 만료
- [ ] 모든 유닛 테스트 통과
- [ ] 모든 e2e 테스트 통과
