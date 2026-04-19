# nestjs-bootstrap

Phase 2 adds local data infrastructure around the current SQLite-first local baseline, Redis-backed health checks, and a repeatable local workflow for bootstrapping the service.

## Prerequisites

- Bun `1.3.10`
- Node.js `>=22`
- Docker Desktop or another Docker-compatible runtime if you want the bundled Postgres and Redis services

## Setup

1. Install dependencies.
2. Copy `.env.example` to `.env`.
3. Create the local SQLite directory used by the default config.

```bash
bun install
cp .env.example .env
mkdir -p data
```

`.env.example` is already wired for the default local SQLite workflow:

- `DB_DRIVER=sqlite`
- `SQLITE_PATH=./data/dev.sqlite`
- `REDIS_HOST=localhost`
- `REDIS_PORT=6379`

## Local Runbook

### 1. Start infrastructure or the full stack

The local `.env` flow stays SQLite-first. If you want Redis for the health check or want to run against Postgres locally, start the bundled infrastructure services:

```bash
docker compose up -d postgres redis
```

To build and run the API in Docker too, start the `app` service. It depends on healthy `postgres` and `redis` containers, uses the bundled Postgres service by default via the checked-in `DB_DRIVER=postgres` and Postgres tuple values in `docker-compose.yml`, and exposes the API on `localhost:3000`:

```bash
docker compose up --build app
```

### 2. Run migrations

```bash
bun run db:migrate
```

The tracked Drizzle config now includes checked-in baseline migrations for both supported drivers. Use `bun run db:generate` after schema changes and `bun run db:push` only when you intentionally want Drizzle to apply schema changes directly without producing migration artifacts.

Leave `DATABASE_MIGRATIONS_DIR` blank to use the driver-aware defaults:

- SQLite: `./drizzle/migrations/sqlite`
- Postgres: `./drizzle/migrations/postgres`

### 3. Seed core data

```bash
mkdir -p data
bun run db:seed
```

The seed script is intentionally narrow: it inserts a `seeded` snapshot row for the active driver once the baseline schema exists. It is a local bootstrap helper, not a substitute for running the checked-in migrations.

### 4. Start the API

```bash
bun run start:dev
```

Or run the containerized API against the bundled Postgres and Redis services:

```bash
docker compose up --build app
```

## Health And Docs Endpoints

- Local dev API root: `http://localhost:3000/api/v1`
- Local dev health details: `http://localhost:3000/api/v1/health/details`
- Local dev Swagger UI: `http://localhost:3000/api/docs`
- Local dev Swagger JSON: `http://localhost:3000/api/docs/json`
- Docker app API root: `http://localhost:3000/api/v1`
- Docker app health details: `http://localhost:3000/api/v1/health/details`

The root endpoint returns the app name, version, environment, and the request `traceId`. The health details endpoint returns database and cache connectivity as booleans, and the Docker `app` service uses that readiness endpoint for its container healthcheck. Swagger is only enabled outside production, so the checked-in Docker `app` service does not expose `/api/docs` or `/api/docs/json`.

## SQLite Notes

- SQLite is the default local path because it has the smallest setup cost.
- The app and Drizzle default to `./data/dev.sqlite` when `DATABASE_URL` is blank and `DB_DRIVER=sqlite`.
- Leaving `DATABASE_MIGRATIONS_DIR` blank keeps SQLite-generated artifacts in `./drizzle/migrations/sqlite`.
- Keep `mkdir -p data` in the setup flow for fresh clones and clean worktrees.

## Postgres Notes

- Switch to Postgres by setting `DB_DRIVER=postgres`.
- The runtime has Postgres connection settings, and the checked-in Docker `app` service already uses the bundled `postgres` container by default.
- The checked-in Postgres baseline migration lives in `./drizzle/migrations/postgres`, and `bun run db:seed` can add the baseline `health_snapshots` seed row after migrations run.
- You can either set a full `DATABASE_URL` or rely on `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB`.
- Leaving `DATABASE_MIGRATIONS_DIR` blank keeps Postgres-generated artifacts in `./drizzle/migrations/postgres`.

Example Postgres-oriented env values:

```env
DB_DRIVER=postgres
DATABASE_URL=
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=app
```

## Redis Note

Redis is optional for basic boot, but `GET /api/v1/health/details` reports cache health, so running Redis locally gives a fully healthy response. The current codebase also includes a small cache example service that builds the namespaced health-check key from `HEALTH_CACHE_KEY`.

## Docker Compose Services

`docker-compose.yml` provides:

- `app` on `localhost:3000`
- `postgres` on `localhost:5432`
- `redis` on `localhost:6379`

The `app` service runs with `NODE_ENV=production` and the bundled Postgres connection defaults, so expect the API and readiness endpoints to be available but not Swagger.

Start the full stack:

```bash
docker compose up --build
```

Start just the infrastructure services:

```bash
docker compose up -d postgres redis
```

Stop them:

```bash
docker compose down
```

## Verification

```bash
bun run lint
bun run build
bun run test:e2e
```
