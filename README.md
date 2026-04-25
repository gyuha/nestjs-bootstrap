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
pnpm docker:up
pnpm docker:down
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
pnpm db:studio
```

Startup migrations are allowed in `local` and `test`. `staging` and `production` must run migrations through `pnpm db:migrate` or a separate deployment job.
