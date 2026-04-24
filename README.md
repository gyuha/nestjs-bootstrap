# nestjs-bootstrap

NestJS DDD bootstrap project for building modular monolith backends with Bun.

## Current Milestone

M0 foundation is implemented:

- NestJS application shell
- Bun package scripts
- TypeScript strict mode
- Biome format/lint configuration
- typed environment validation
- URI API versioning
- Swagger setup for development
- neutral `/api/health` endpoint
- first e2e test

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

## Run

```bash
bun run start:dev
```

Health endpoint:

```bash
curl http://localhost:3000/api/health
```

Swagger UI:

```text
http://localhost:3000/docs
```

## Checks

```bash
bun run check
bun run build
bun run test:e2e
```

## Roadmap

The approved roadmap spec is in `docs/superpowers/specs/2026-04-24-nestjs-ddd-bootstrap-roadmap-design.md`.
M1-M6 should be implemented through separate implementation plans.
