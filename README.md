# nestjs-bootstrap

NestJS DDD bootstrap project for building modular monolith backends with Bun.

## Current Milestone

M0 foundation and M1 common layer are implemented:

- NestJS application shell
- Bun package scripts
- TypeScript strict mode
- Biome format/lint configuration
- typed environment validation
- URI API versioning
- Swagger setup for development
- standard `{ data, meta }` success response envelope
- standard `{ error, meta }` error response envelope
- trace id propagation with `x-trace-id`
- request logging with method, path, status, duration, and trace id
- basic Helmet, CORS, and rate limiting setup
- neutral `/api/health` endpoint through an application use case
- unit and e2e tests for the common pipeline

## Requirements

- Bun

## Install

```bash
bun install
```

## Environment

Copy the example file when creating local overrides:

```bash
cp .env.example .env.development.local
```

Default development values are already provided in `.env.development`.

| Variable | Default | Description |
| --- | --- | --- |
| `NODE_ENV` | `development` | Runtime environment |
| `APP_NAME` | `nestjs-bootstrap` | Application name used in Swagger |
| `APP_PORT` | `3000` | HTTP port |
| `API_PREFIX` | `api` | Global API prefix |
| `API_VERSION` | `1` | Default URI API version |
| `SWAGGER_ENABLED` | `true` | Enables Swagger UI |
| `SWAGGER_PATH` | `docs` | Swagger UI path |
| `CORS_ENABLED` | `true` | Enables CORS |
| `CORS_ORIGIN` | `*` | Comma-separated allowed origins or `*` |
| `RATE_LIMIT_TTL_SECONDS` | `60` | Rate limit window in seconds |
| `RATE_LIMIT_MAX` | `100` | Maximum requests per rate limit window |

## Run

```bash
bun run start:dev
```

Health endpoint:

```bash
curl -H 'x-trace-id: local-test' http://localhost:3000/api/health
```

Expected response shape:

```json
{
  "data": {
    "status": "ok"
  },
  "meta": {
    "traceId": "local-test"
  }
}
```

Swagger UI:

```text
http://localhost:3000/docs
```

## Checks

```bash
bun run check
bun run build
bun run test
bun run test:e2e
```

## Roadmap

The approved roadmap spec is in `docs/superpowers/specs/2026-04-24-nestjs-ddd-bootstrap-roadmap-design.md`.
M1-M6 should be implemented through separate implementation plans.
