# Auth and Users Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Auth and Users modules described in `docs/superpowers/specs/2026-04-25-auth-users-design.md`.

**Architecture:** Build the shared database schema first, then implement `users` as the owner of user profile/status/role, and finally implement `auth` as the owner of identities, JWT access tokens, refresh-token rotation, Google OAuth, and RBAC guards. Keep DDD boundaries: domain ports in `domain`, use cases in `application`, Drizzle adapters in `infrastructure`, and controllers/guards/DTOs in `presentation`.

**Tech Stack:** NestJS, TypeScript, pnpm, Drizzle ORM, PostgreSQL, Vitest, Supertest, Argon2id, `@nestjs/jwt`, `passport`, `passport-google-oauth20`, existing response/error/trace/bootstrap infrastructure.

---

## File Structure

- Modify: `package.json`, `.env.example`, `.env.test`, `src/bootstrap/config/env.schema.ts`, `src/bootstrap/config/configuration.ts`
- Modify: `src/shared/infrastructure/database/schema/index.ts`
- Create: `src/shared/domain/pagination.ts`
- Create: `src/modules/users/**`
- Create: `src/modules/auth/**`
- Modify: `src/app.module.ts`
- Create/modify: `test/factories/**`, `test/auth/**`, `test/users/**`

## Task 1: Auth/Users Dependencies and Environment

**Files:**
- Modify: `package.json`
- Modify: `.env.example`
- Modify: `.env.test`
- Modify: `src/bootstrap/config/env.schema.ts`
- Modify: `src/bootstrap/config/configuration.ts`
- Test: `test/config/env.schema.spec.ts`

- [ ] **Step 1: Add failing config tests**

Add tests to `test/config/env.schema.spec.ts`:

```ts
const authEnv = {
  JWT_ACCESS_TOKEN_SECRET: "test-access-secret-that-is-at-least-32-characters",
  GOOGLE_CLIENT_ID: "google-client-id",
  GOOGLE_CLIENT_SECRET: "google-client-secret",
  GOOGLE_CALLBACK_URL: "http://localhost:3000/api/v1/auth/google/callback",
};

it("parses auth configuration defaults", () => {
  const env = parseEnv({
    ...validEnv,
    ...authEnv,
  });

  expect(env.JWT_ACCESS_TOKEN_EXPIRES_IN).toBe("15m");
  expect(env.REFRESH_TOKEN_EXPIRES_IN).toBe("30d");
});

it("requires jwt and google oauth secrets", () => {
  expect(() => parseEnv(validEnv)).toThrow("Invalid environment");
});
```

Update the existing `validEnv` fixture in the same file to include `...authEnv` so the pre-existing env tests still parse a complete environment.

- [ ] **Step 2: Install auth dependencies**

Run:

```bash
pnpm add @nestjs/jwt @nestjs/passport passport passport-google-oauth20 argon2
pnpm add -D @types/passport @types/passport-google-oauth20
```

Expected: install exits 0 and `pnpm-lock.yaml` updates.

- [ ] **Step 3: Extend env schema/config**

Add required/optional env vars:

```ts
JWT_ACCESS_TOKEN_SECRET: z.string().min(32),
JWT_ACCESS_TOKEN_EXPIRES_IN: z.string().default("15m"),
REFRESH_TOKEN_EXPIRES_IN: z.string().default("30d"),
GOOGLE_CLIENT_ID: z.string().min(1),
GOOGLE_CLIENT_SECRET: z.string().min(1),
GOOGLE_CALLBACK_URL: z.string().url(),
```

Map them in `configuration()`:

```ts
auth: {
  accessTokenSecret: env.JWT_ACCESS_TOKEN_SECRET,
  accessTokenExpiresIn: env.JWT_ACCESS_TOKEN_EXPIRES_IN,
  refreshTokenExpiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
  google: {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    callbackUrl: env.GOOGLE_CALLBACK_URL,
  },
},
```

Update `.env.example` and `.env.test` with deterministic test values.

- [ ] **Step 4: Verify and commit**

Run:

```bash
pnpm test test/config/env.schema.spec.ts
pnpm build
pnpm lint
pnpm format:check
```

Commit:

```bash
git add package.json pnpm-lock.yaml .env.example .env.test src/bootstrap/config test/config/env.schema.spec.ts
git commit -m "feat: add auth configuration"
```

## Task 2: Database Schema and Shared Types

**Files:**
- Modify: `src/shared/infrastructure/database/schema/index.ts`
- Create: `src/shared/domain/pagination.ts`
- Test: `test/database/auth-users-schema.spec.ts`

- [ ] **Step 1: Add schema tests**

Create `test/database/auth-users-schema.spec.ts`:

```ts
import { describe, expect, it } from "vitest";
import { authIdentities, refreshTokens, users } from "../../src/shared/infrastructure/database/schema";

describe("auth/users schema", () => {
  it("exports required tables", () => {
    expect(users).toBeDefined();
    expect(authIdentities).toBeDefined();
    expect(refreshTokens).toBeDefined();
  });
});
```

- [ ] **Step 2: Define tables**

In schema root, define PostgreSQL tables:

```ts
export const userRole = pgEnum("user_role", ["USER", "ADMIN"]);
export const userStatus = pgEnum("user_status", ["active", "inactive"]);
export const authProvider = pgEnum("auth_provider", ["password", "google"]);
```

Define `users` with `id uuid primaryKey defaultRandom`, unique `email`, `displayName`, nullable `avatarUrl`, nullable `bio`, `status`, `role`, timestamps.

Define `authIdentities` with `userId` FK, `provider`, `providerUserId`, nullable `passwordHash`, `emailVerified`, timestamps, unique `(provider, providerUserId)`, unique `(userId, provider)`.

Define `refreshTokens` with `userId` FK, unique `tokenHash`, `expiresAt`, nullable `revokedAt`, nullable `replacedByTokenId`, nullable `userAgent`, nullable `ipAddress`, `createdAt`.

- [ ] **Step 3: Add shared pagination type**

Create `src/shared/domain/pagination.ts`:

```ts
export type PageRequest = {
  page: number;
  limit: number;
};

export type PageResult<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
};
```

- [ ] **Step 4: Generate migration and verify**

Run:

```bash
pnpm db:generate
pnpm test test/database/auth-users-schema.spec.ts
pnpm build
pnpm lint
pnpm format:check
```

Commit:

```bash
git add src/shared/infrastructure/database src/shared/domain/pagination.ts test/database/auth-users-schema.spec.ts
git commit -m "feat: add auth users database schema"
```

## Task 3: Users Domain and Repository

**Files:**
- Create: `src/modules/users/domain/user.types.ts`
- Create: `src/modules/users/domain/user.entity.ts`
- Create: `src/modules/users/domain/user.repository.ts`
- Create: `src/modules/users/infrastructure/users.drizzle-repository.ts`
- Create: `src/modules/users/users.module.ts`
- Test: `test/users/user.entity.spec.ts`, `test/users/users.repository.spec.ts`

- [ ] **Step 1: Write domain tests**

Test role/status defaults and inactive transition:

```ts
const user = User.create({ email: "a@example.com", displayName: "A" });
expect(user.role).toBe("USER");
expect(user.status).toBe("active");
user.deactivate();
expect(user.status).toBe("inactive");
```

- [ ] **Step 2: Implement domain model**

Define:

```ts
export type UserRole = "USER" | "ADMIN";
export type UserStatus = "active" | "inactive";
export type UserProfilePatch = {
  displayName?: string;
  avatarUrl?: string | null;
  bio?: string | null;
};
```

`User` should expose `create`, `updateProfile`, `changeRole`, `changeStatus`, and `deactivate`.

- [ ] **Step 3: Define repository port**

`UserRepository` methods:

```ts
create(input): Promise<User>;
findById(id: string): Promise<User | null>;
findByEmail(email: string): Promise<User | null>;
list(filter): Promise<PageResult<User>>;
update(user: User): Promise<User>;
```

- [ ] **Step 4: Implement Drizzle adapter**

Use `DATABASE` token. Map rows to `User`. Implement pagination with page/limit, status, role, and search over email/displayName.

- [ ] **Step 5: Verify and commit**

Run:

```bash
pnpm test test/users/user.entity.spec.ts test/users/users.repository.spec.ts
pnpm build
pnpm lint
pnpm format:check
```

Commit:

```bash
git add src/modules/users test/users
git commit -m "feat: add users domain repository"
```

## Task 4: Auth Identity and Refresh Token Repositories

**Files:**
- Create: `src/modules/auth/domain/auth-identity.types.ts`
- Create: `src/modules/auth/domain/auth-identity.repository.ts`
- Create: `src/modules/auth/domain/refresh-token.repository.ts`
- Create: `src/modules/auth/infrastructure/auth-identity.drizzle-repository.ts`
- Create: `src/modules/auth/infrastructure/refresh-token.drizzle-repository.ts`
- Create: `src/modules/auth/auth.module.ts`
- Test: `test/auth/auth-identity.repository.spec.ts`, `test/auth/refresh-token.repository.spec.ts`

- [ ] **Step 1: Write repository contract tests**

Cover:

- create/find password identity by email provider id
- create/find Google identity by `sub`
- create refresh token hash
- mark token revoked with `replacedByTokenId`

- [ ] **Step 2: Implement ports and adapters**

Ports:

```ts
findByProvider(provider, providerUserId)
findByUserAndProvider(userId, provider)
create(input)
```

Refresh token port:

```ts
create(input)
findValidByHash(tokenHash)
revoke(tokenId, replacedByTokenId)
revokeAllForUser(userId)
```

- [ ] **Step 3: Verify and commit**

Run:

```bash
pnpm test test/auth/auth-identity.repository.spec.ts test/auth/refresh-token.repository.spec.ts
pnpm build
pnpm lint
pnpm format:check
```

Commit:

```bash
git add src/modules/auth test/auth
git commit -m "feat: add auth persistence repositories"
```

## Task 5: Password Hashing and Token Services

**Files:**
- Create: `src/modules/auth/domain/password-hasher.ts`
- Create: `src/modules/auth/infrastructure/argon2-password-hasher.ts`
- Create: `src/modules/auth/application/token.service.ts`
- Create: `src/modules/auth/application/refresh-token.service.ts`
- Test: `test/auth/password-hasher.spec.ts`, `test/auth/token.service.spec.ts`

- [ ] **Step 1: Write service tests**

Assert Argon2 hash verifies correct password and rejects wrong password. Assert refresh tokens are returned as plain token + hash pair, and hashes do not equal plain tokens.

- [ ] **Step 2: Implement adapters/services**

Use Argon2id:

```ts
argon2.hash(password, { type: argon2.argon2id })
argon2.verify(hash, password)
```

Use `crypto.randomBytes(48).toString("base64url")` for refresh tokens and SHA-256 for token lookup hashes.

- [ ] **Step 3: Verify and commit**

Run:

```bash
pnpm test test/auth/password-hasher.spec.ts test/auth/token.service.spec.ts
pnpm build
pnpm lint
pnpm format:check
```

Commit:

```bash
git add src/modules/auth test/auth
git commit -m "feat: add auth token services"
```

## Task 6: Users Application and Controllers

**Files:**
- Create: `src/modules/users/application/*.ts`
- Create: `src/modules/users/presentation/*.ts`
- Modify: `src/modules/users/users.module.ts`
- Modify: `src/app.module.ts`
- Test: `test/users/users.e2e-spec.ts`

- [ ] **Step 1: Write e2e tests with guard overrides**

Cover:

- `GET /api/v1/users/me`
- `PATCH /api/v1/users/me`
- ADMIN `GET /api/v1/users`
- ADMIN `PATCH /api/v1/users/:id/status`
- non-admin receives 403 on admin route

- [ ] **Step 2: Implement use cases**

Use cases:

```text
GetCurrentUser
UpdateCurrentUserProfile
ListUsers
CreateUserByAdmin
GetUserById
UpdateUserByAdmin
ChangeUserStatus
ChangeUserRole
DeactivateUser
```

- [ ] **Step 3: Implement controllers/DTOs**

Controllers:

```text
UsersMeController
UsersAdminController
```

DTOs should validate only editable fields. Do not allow self-service email/role/status edits.

- [ ] **Step 4: Verify and commit**

Run:

```bash
pnpm test:e2e test/users/users.e2e-spec.ts
pnpm test
pnpm test:e2e
pnpm build
pnpm lint
pnpm format:check
```

Commit:

```bash
git add src/modules/users src/app.module.ts test/users
git commit -m "feat: add users api"
```

## Task 7: Auth Register/Login/Refresh/Logout

**Files:**
- Create: `src/modules/auth/application/*.ts`
- Create: `src/modules/auth/presentation/auth.controller.ts`
- Create: `src/modules/auth/presentation/dto/*.ts`
- Modify: `src/modules/auth/auth.module.ts`
- Modify: `src/app.module.ts`
- Test: `test/auth/auth-password.e2e-spec.ts`

- [ ] **Step 1: Write e2e tests**

Cover:

- register creates user and password identity with `emailVerified=false`
- login returns access token and refresh token
- wrong password returns same generic auth failure
- refresh rotates token
- reused revoked refresh token fails
- logout revokes refresh token
- inactive user cannot login/refresh

- [ ] **Step 2: Implement use cases**

Use cases:

```text
RegisterWithPassword
LoginWithPassword
RefreshSession
LogoutSession
GetAuthenticatedUser
```

- [ ] **Step 3: Implement controller**

Endpoints:

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

- [ ] **Step 4: Verify and commit**

Run:

```bash
pnpm test:e2e test/auth/auth-password.e2e-spec.ts
pnpm test
pnpm test:e2e
pnpm build
pnpm lint
pnpm format:check
```

Commit:

```bash
git add src/modules/auth src/app.module.ts test/auth
git commit -m "feat: add password auth flow"
```

## Task 8: JWT Guard, Current User, and RBAC

**Files:**
- Create: `src/modules/auth/presentation/guards/jwt-auth.guard.ts`
- Create: `src/modules/auth/presentation/guards/roles.guard.ts`
- Create: `src/modules/auth/presentation/decorators/current-user.decorator.ts`
- Create: `src/modules/auth/presentation/decorators/roles.decorator.ts`
- Modify: users/auth controllers to use real guards
- Test: `test/auth/rbac.e2e-spec.ts`

- [ ] **Step 1: Write RBAC e2e tests**

Cover valid user token, inactive user rejection, admin access, user forbidden on admin route.

- [ ] **Step 2: Implement guards/decorators**

`JwtAuthGuard` verifies JWT, loads User, rejects inactive users, and attaches current user to request.

`RolesGuard` checks route metadata from `@Roles()`.

- [ ] **Step 3: Verify and commit**

Run:

```bash
pnpm test:e2e test/auth/rbac.e2e-spec.ts
pnpm test
pnpm test:e2e
pnpm build
pnpm lint
pnpm format:check
```

Commit:

```bash
git add src/modules/auth src/modules/users test/auth
git commit -m "feat: add jwt rbac guards"
```

## Task 9: Google OAuth Flow

**Files:**
- Create: `src/modules/auth/infrastructure/google-oauth.strategy.ts`
- Create: `src/modules/auth/application/google-login.use-case.ts`
- Modify: `src/modules/auth/presentation/auth.controller.ts`
- Test: `test/auth/google-oauth.use-case.spec.ts`, `test/auth/google-oauth.e2e-spec.ts`

- [ ] **Step 1: Write tests**

Cover:

- existing Google identity logs in
- verified Google email connects to existing password user
- unverified Google email does not auto-link to existing user
- new verified Google profile creates User + Google identity

- [ ] **Step 2: Implement Google strategy and use case**

Use `passport-google-oauth20`. Extract:

```text
sub -> providerUserId
email
email_verified
name -> displayName
picture -> avatarUrl
```

- [ ] **Step 3: Wire endpoints**

```text
GET /api/v1/auth/google
GET /api/v1/auth/google/callback
```

Callback returns the same token response shape as password login.

- [ ] **Step 4: Verify and commit**

Run:

```bash
pnpm test test/auth/google-oauth.use-case.spec.ts
pnpm test:e2e test/auth/google-oauth.e2e-spec.ts
pnpm test
pnpm test:e2e
pnpm build
pnpm lint
pnpm format:check
```

Commit:

```bash
git add src/modules/auth test/auth
git commit -m "feat: add google oauth flow"
```

## Task 10: Swagger, Factories, Docs, and Final Verification

**Files:**
- Create: `test/factories/user.factory.ts`
- Create: `test/factories/auth.factory.ts`
- Modify: `README.md`
- Modify: `AGENTS.md` if needed
- Modify: controllers DTO metadata

- [ ] **Step 1: Add factories**

Factories should create valid User, password identity, admin user, refresh token test data.

- [ ] **Step 2: Add Swagger annotations**

Ensure auth/users DTOs and controllers include `@ApiTags`, response descriptions, bearer auth metadata on protected routes.

- [ ] **Step 3: Update docs**

README should document:

```text
auth env vars
password register/login
Google OAuth env setup
refresh flow
admin/user roles
```

- [ ] **Step 4: Final verification**

Run:

```bash
pnpm db:generate
pnpm build
pnpm lint
pnpm format:check
pnpm test
pnpm test:e2e
docker build -t nestjs-bootstrap:local .
docker compose up -d postgres redis
docker compose run --rm app pnpm db:migrate:prod
```

- [ ] **Step 5: Commit**

```bash
git add README.md AGENTS.md src/modules test/factories src/shared/infrastructure/database
git commit -m "docs: document auth users workflow"
```

## Final Verification Checklist

- [ ] `pnpm lint`
- [ ] `pnpm format:check`
- [ ] `pnpm test`
- [ ] `pnpm test:e2e`
- [ ] `pnpm build`
- [ ] `docker build -t nestjs-bootstrap:local .`
- [ ] `docker compose up -d postgres redis`
- [ ] `docker compose run --rm app pnpm db:migrate:prod`

## Spec Coverage Review

- Password auth: Tasks 1, 5, 7.
- Google OAuth: Tasks 1, 9.
- User + Identity split: Tasks 2, 3, 4.
- Refresh token DB hash and rotation: Tasks 2, 4, 5, 7.
- RBAC USER/ADMIN: Tasks 3, 6, 8.
- `/users/me` and admin Users API: Task 6.
- Inactive user rejection: Tasks 7, 8.
- Unit/e2e coverage: Tasks 1-10.
