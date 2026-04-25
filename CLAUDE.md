# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A production-ready NestJS backend template with DDD (Domain-Driven Design) architecture, implementing OAuth (Google/Kakao) + Password authentication, JWT authorization with RBAC (USER/ADMIN roles), and PostgreSQL + Redis storage.

## Commands

```bash
# Development
pnpm build              # Build the project
pnpm start:dev          # Run in watch mode
pnpm start:debug        # Debug mode with watch
pnpm start:prod         # Run production build

# Code Quality
pnpm biome lint ./src   # Lint (use --write to auto-fix)
pnpm biome format ./src # Format

# Database
pnpm migration:generate # Generate migrations from schema changes
pnpm migration:run      # Run pending migrations
pnpm migration:deploy   # Deploy to production

# Testing
pnpm test               # Run unit tests
pnpm test:watch         # Run in watch mode
pnpm test:cov           # Coverage report
pnpm test:e2e           # End-to-end tests

# Docker
docker-compose up -d    # Start all services (app + postgres + redis)
docker-compose down     # Stop all services
```

## Architecture

### DDD Layer Structure

Each module follows 4-layer DDD:

```
modules/<name>/
├── domain/           # Business logic, entities, interfaces
│   ├── entities/
│   ├── value-objects/
│   ├── repositories/  # Repository interfaces (not implementations)
│   └── services/     # Service interfaces (not implementations)
├── application/      # Use cases, application services, DTOs
│   ├── services/
│   └── dto/
├── infrastructure/   # External concerns (DB, Redis, external APIs)
│   ├── repositories/ # Repository implementations
│   └── services/     # Service implementations
└── presentation/     # Controllers, guards, decorators, interceptors
```

### Module Organization

- `modules/auth/` - Authentication (OAuth + password, JWT tokens)
- `modules/users/` - User management (CRUD, RBAC)
- `infrastructure/database/` - Drizzle ORM, PostgreSQL schemas
- `infrastructure/redis/` - Redis client service
- `shared/` - Cross-cutting concerns (interceptors, filters, decorators)
- `bootstrap/` - App initialization (swagger, security, logging, validation, health)
- `config/` - Environment configuration with Zod validation

### Key Design Patterns

**Dependency Injection with String Tokens**:
Interfaces cannot be used as DI tokens. Use string constants with `@Inject()`:
```typescript
const AUTH_TOKEN_REPOSITORY = 'AUTH_TOKEN_REPOSITORY';
{ provide: AUTH_TOKEN_REPOSITORY, useClass: RedisPostgresTokenRepository }
// Then inject with:
@Inject(AUTH_TOKEN_REPOSITORY) private readonly tokenRepo: AuthTokenRepositoryInterface
```

**Token-based Auth Architecture**:
- Access token: JWT, 15min TTL, contains userId/email/role
- Refresh token: UUID + random, stored in Redis + PostgreSQL (hybrid)
- Fast validation: Redis for quick lookups
- Persistent storage: PostgreSQL for audit/recovery

**Repository Pattern**:
- Interfaces defined in `domain/repositories/`
- Implementations in `infrastructure/repositories/`
- Use string token DI, not interface types

### Environment Configuration

Environment variables validated via Zod schema (`src/config/env.schema.ts`):
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Minimum 32 characters
- `JWT_EXPIRES_IN` - Default '15m'
- `REFRESH_TOKEN_EXPIRES_IN` - Default '7d'

### Database

- ORM: Drizzle with PostgreSQL
- Schemas in `src/infrastructure/database/schema/`
- Migrations managed via Drizzle Kit
- Key tables: `users`, `oauth_accounts`, `refresh_tokens`

### API Response Format

All responses wrapped in envelope via `ResponseEnvelopeInterceptor`:
```typescript
{ data: T, meta?: { timestamp, traceId } }
```

### API Versioning

Enabled via `api-version.decorator.ts`. Routes prefixed with `/api/v1`.

## Tech Stack

- NestJS 11 with TypeScript
- Drizzle ORM + PostgreSQL
- Redis (ioredis)
- Passport.js (JWT + OAuth)
- Zod for env validation
- Biome for linting/formatting
- Husky + Commitlint for conventional commits
