# NestJS DDD Bootstrap Project — Design Spec

**Date:** 2026-04-25
**Topic:** NestJS DDD Bootstrap Project Full Implementation
**Status:** Approved

---

## 1. Overview

This project is a production-ready NestJS backend template based on DDD (Domain-Driven Design) with modular-monolithic architecture. It provides auth (Google/Kakao OAuth + Password), users management, PostgreSQL + Redis, and Docker-based deployment.

---

## 2. Architecture

### 2.1 Project Structure

```
src/
├── main.ts                    # Bootstrap entry
├── app.module.ts              # Root module
│
├── bootstrap/
│   ├── swagger/               # Swagger/OpenAPI setup
│   ├── validation/            # Config validation (Zod)
│   ├── security/              # CORS, Helmet, Rate limiting
│   └── logging/               # Request logging + trace id
│
├── shared/
│   ├── domain/                # Base entities, value objects, repository interfaces
│   ├── application/           # Shared use cases, DTOs, query helpers
│   ├── infrastructure/        # DB (Drizzle), Redis, external services
│   └── presentation/         # Shared guards, decorators, interceptors
│
└── modules/
    ├── auth/
    │   ├── domain/           # Auth entities, OAuth providers, token interfaces
    │   ├── application/      # Login use cases, token refresh use case
    │   ├── infrastructure/   # Google/Kakao OAuth, JWT service, Redis+DB token store
    │   └── presentation/    # Auth controller, DTOs, Swagger decorators
    │
    └── users/
        ├── domain/           # User entity, role value object
        ├── application/     # User CRUD use cases
        ├── infrastructure/  # Drizzle user repository
        └── presentation/    # Users controller, DTOs
```

### 2.2 Layer Responsibilities

| Layer | Responsibility |
|-------|----------------|
| **Domain** | Business logic, entities, interfaces (no external dependencies) |
| **Application** | Use cases, orchestration, DTOs |
| **Infrastructure** | External implementations (DB, Redis, OAuth providers) |
| **Presentation** | HTTP layer (controllers, DTOs, decorators) |

---

## 3. Implementation Phases

### Phase 1: Foundation (first)
- NestJS, pnpm, TypeScript, Biome setup
- API versioning (v1 prefix)
- Swagger documentation
- Config validation (Zod with environment variables)
- CORS, Helmet, Rate limiting
- Request logging + trace id propagation

### Phase 2: Data and Infrastructure
- Drizzle ORM with PostgreSQL
- Migrations, seeders, factories
- Repository abstraction
- Redis client setup
- Docker-compose with PostgreSQL + Redis + healthcheck
- Startup migration in Docker Compose only

### Phase 3: Auth Module
- Google + Kakao OAuth integration
- Password login (bcrypt)
- JWT access token (15min TTL)
- Refresh token (Redis + PostgreSQL hybrid)
- RBAC (USER / ADMIN roles only)
- Auth DTOs, guards, Swagger docs

### Phase 4: Users Module
- Users CRUD API
- User profile management
- User status (active/inactive) and role management
- Domain rules separated from application service
- User tests and documentation

### Phase 5: Quality and Delivery
- Unit + e2e test utilities
- Husky pre-push (lint, format, test)
- Dockerfile multi-stage build
- Startup migration support

---

## 4. Data Architecture

### 4.1 Database: PostgreSQL Only
- Dev/test/prod 모두 PostgreSQL 사용 (SQLite 미지원)
- Drizzle ORM for schema, migrations, repository

### 4.2 Tables

**users**
| Column | Type |
|--------|------|
| id | uuid (PK) |
| email | varchar(255) unique |
| password_hash | varchar(255) nullable |
| name | varchar(100) |
| role | enum(USER, ADMIN) |
| status | enum(ACTIVE, INACTIVE) |
| created_at | timestamp |
| updated_at | timestamp |

**oauth_accounts**
| Column | Type |
|--------|------|
| id | uuid (PK) |
| user_id | uuid (FK → users) |
| provider | enum(GOOGLE, KAKAO) |
| provider_user_id | varchar(255) |
| access_token | text |
| refresh_token | text |
| expires_at | timestamp |
| created_at | timestamp |

**refresh_tokens**
| Column | Type |
|--------|------|
| id | uuid (PK) |
| token_hash | varchar(255) unique |
| user_id | uuid (FK → users) |
| device_info | varchar(255) |
| expires_at | timestamp |
| revoked_at | timestamp nullable |
| created_at | timestamp |

### 4.3 Repository Abstraction

```typescript
// domain/repository/user.repository.interface.ts
interface UserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  findByOAuthProvider(provider: OAuthProvider, providerUserId: string): Promise<User | null>;
  save(user: User): Promise<void>;
  update(user: User): Promise<void>;
  delete(id: UserId): Promise<void>;
}
```

Infrastructure layer implements this interface via Drizzle.

### 4.4 Token Storage: Redis + PostgreSQL Hybrid

| Store | Purpose | Data |
|-------|---------|------|
| Redis | Fast token validation | Active refresh tokens (key: `refresh:{token_hash}`) |
| PostgreSQL | Token metadata, revocation | Full refresh token records |

**On token refresh:**
1. Check Redis for active token
2. If Redis miss → check PostgreSQL for non-revoked token
3. If valid → issue new access token + rotate refresh token

---

## 5. Auth Flow

### 5.1 Login Flow

```
Client → POST /api/v1/auth/login/password { email, password }
      OR POST /api/v1/auth/login/oauth/{provider} { code }

Server → Validate credentials / OAuth callback
       → Generate JWT access token (15min TTL)
       → Generate refresh token, store in Redis + PostgreSQL

Client ← { access_token, refresh_token, user }
```

### 5.2 Token Refresh Flow

```
Client → POST /api/v1/auth/refresh { refresh_token }
Server → Check Redis for active token
       → If miss, check PostgreSQL for valid non-revoked token
       → If valid, generate new access token + rotate refresh token
Client ← { access_token, refresh_token }
```

### 5.3 JWT Structure

```json
{
  "sub": "user_id (uuid)",
  "email": "user@example.com",
  "role": "USER",
  "iat": 1234567890,
  "exp": 1234568790
}
```

### 5.4 RBAC

- Roles: `USER`, `ADMIN` (2-tier only)
- `@Roles('ADMIN')` decorator → `RolesGuard` → `Reflector`
- Route-level and method-level authorization

---

## 6. Error Handling & Response Format

### 6.1 Response Envelope

```typescript
// Success
{ "data": T, "meta": { "traceId": "abc" } }

// Error
{ "error": { "code": "AUTH_INVALID_CREDENTIALS", "message": "...", "details": {} }, "meta": { "traceId": "abc" } }
```

### 6.2 Error Codes

| Prefix | Meaning |
|--------|---------|
| `AUTH_*` | Authentication / authorization errors (401, 403) |
| `USER_*` | User management errors (404, 409) |
| `VALIDATION_*` | DTO validation failures (400) |
| `INTERNAL_*` | Server errors (500) |

### 6.3 Exception Hierarchy

```
BaseHttpException (caught by NestJS global exception handler)
├── AuthException (401/403)
├── UserException (404/409)
├── ValidationException (400)
└── InternalException (500)
```

### 6.4 Swagger Documentation

All error codes documented via `@ApiResponse({ status: 401, schema: { $ref: '#/components/schemas/AuthError' } })`

---

## 7. Testing & DevOps

### 7.1 Test Utilities

**Unit tests:**
- `MockFactory` for repository interfaces
- `createTestUser()`, `createTestOAuthAccount()` fixture helpers
- `generateMockUserRepository()` for use case testing

**e2e tests:**
- Testcontainers for PostgreSQL
- Redis via docker-compose test override
- Swagger API test helpers

### 7.2 Docker Strategy

```yaml
# docker-compose.yml
services:
  app:
    build: .
    healthcheck: { test: ["CMD", "curl", "-f", "http://localhost:3000/health"] }
    depends_on: postgres, redis
  postgres:
    image: postgres:16
    volumes: [./drizzle:/docker-entrypoint-initdb.d]
  redis:
    image: redis:7
```

### 7.3 Startup Migration

- Migration runs automatically **only in Docker Compose environment**
- Production migration is manual (via `npm run migration:deploy`)
- `startup.sh` script or docker-compose `command` override

### 7.4 Husky Pre-push

```bash
# .husky/pre-push
npm run lint && npm run format && npm run test
```

---

## 8. Open Issues Resolved

| Issue | Resolution |
|-------|-------------|
| OAuth provider scope | Google + Kakao + Password login |
| Refresh token storage | Redis + PostgreSQL hybrid |
| RBAC roles | USER / ADMIN only (2-tier) |
| SQLite vs PostgreSQL | PostgreSQL only (no SQLite) |
| Startup migration | Docker Compose environment only |

---

## 9. Acceptance Criteria

### Project Structure
- [ ] `auth`, `users` modules follow DDD 4-layer structure
- [ ] `shared` area separates common concerns

### Authentication
- [ ] OAuth login (Google, Kakao) entry point exists
- [ ] Password login exists
- [ ] JWT access token issuance and validation works
- [ ] Refresh token reissuance flow exists (Redis + PostgreSQL)
- [ ] RBAC-based authorization example works (USER/ADMIN)

### Users
- [ ] User CRUD API exists
- [ ] User profile, status, role management is documented

### Operations
- [ ] Swagger documentation exposed
- [ ] Config validation fails on invalid env vars
- [ ] Standard error handling and response envelope applied
- [ ] Request logs with trace id observable
- [ ] lint, format, test run on pre-push
- [ ] Docker-based startup and healthcheck works

### Testing
- [ ] Unit/e2e test basic execution structure exists
- [ ] Test DB bootstrap and fixture/factory helper exists
- [ ] Example tests for auth and user flows included
