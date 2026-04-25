# nestjs-bootstrap

NestJS DDD Bootstrap Project is an infrastructure-first backend template for modular monolith services.

## Requirements

- Node.js 22+
- pnpm
- Docker

## Local Development

```bash
cp .env.example .env
pnpm install
docker compose up -d postgres redis
pnpm db:migrate
pnpm dev
```

API:

- Health: `GET http://localhost:3000/api/v1/health`
- Swagger: `http://localhost:3000/api/docs`

## Docker

```bash
docker compose build app
docker compose up -d postgres redis
docker compose run --rm app pnpm db:migrate:prod
docker compose up app
pnpm docker:down
```

The compose app does not run migrations on startup. Run migrations manually before starting the app, or run the same command as a deployment job:

```bash
docker run --rm \
  -e DATABASE_URL=postgres://postgres:postgres@host.docker.internal:5432/nestjs_bootstrap \
  nestjs-bootstrap:local \
  pnpm db:migrate:prod
```

## Quality

```bash
pnpm lint
pnpm format:check
pnpm test
pnpm test:e2e
```

## Database

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:migrate:prod
pnpm db:studio
```

`pnpm db:migrate` is the local TypeScript runner. `pnpm db:migrate:prod` runs the compiled migration runner from `dist` and is safe for production containers. Startup migrations are disabled for compose and production; run migrations through an explicit command or separate deployment job.
