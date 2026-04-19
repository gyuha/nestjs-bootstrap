# nestjs-bootstrap

Phase 1 foundation for a NestJS service with typed environment loading, global bootstrap wiring, versioned API routing, request trace IDs, and Swagger in non-production environments.

## Prerequisites

- Bun `1.3.10`
- Node.js `>=22`

## Setup

1. Install dependencies.
2. Copy `.env.example` to `.env`.
3. Adjust local values if needed.

```bash
bun install
cp .env.example .env
```

## Run

```bash
bun run start:dev
```

Default local endpoints:

- API root: `http://localhost:3000/api/v1`
- Swagger UI: `http://localhost:3000/api/docs`
- Swagger JSON: `http://localhost:3000/api/docs/json`

The root endpoint returns the app name, version, environment, and a `traceId` in both the response body and the `x-trace-id` header.

## Environment

Required settings are validated at startup from `src/bootstrap/config/app-config.schema.ts`.

- App: `NODE_ENV`, `PORT`, `APP_NAME`, `APP_DESCRIPTION`, `APP_VERSION`, `APP_CORS_ORIGIN`
- Database placeholders: `DB_DRIVER`, `DATABASE_URL`, `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `SQLITE_PATH`
- Redis placeholders: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`

Invalid configuration fails fast during boot.

## Verification

```bash
bun run lint
bun run build
bun run test:e2e
```

## Phase 1 Scope

- Typed config loading with Zod validation
- Shared bootstrap for security, validation, exception handling, trace IDs, and request logging
- URI versioning with `/api/v1`
- Swagger enabled outside production
- E2E coverage for happy-path boot and invalid configuration rejection
