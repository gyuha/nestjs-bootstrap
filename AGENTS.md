# Repository Guidelines

## Project Structure & Module Organization
Core code lives in `src/`. Feature modules are grouped under `src/modules/*` (`auth`, `users`, `files`, `health`, `chat`, `social`). Shared infrastructure lives in `src/shared/infrastructure/*` for database, cache, queue, email, storage, Redis, and audit concerns. Bootstrap wiring is under `src/bootstrap/*` for validation, logging, security, Swagger, and admin setup. Unit tests sit beside source files as `*.spec.ts`; e2e tests live in `test/*.e2e-spec.ts`.

## Build, Test, and Development Commands
Use Bun for local work; this repo includes `bun.lock`.

- `bun install`: install dependencies.
- `bun run start:dev`: start Nest in watch mode with `.env.development`.
- `bun run build`: compile to `dist/`.
- `bun run start` or `bun run start:prod`: run the compiled app.
- `bun run test`: run unit tests.
- `bun run test:e2e`: run e2e coverage in `test/`.
- `bun run test:cov`: generate coverage output in `coverage/`.
- `bun run lint` / `bun run format` / `bun run check`: Biome lint, format, and full checks.
- `bun run db:push`, `bun run db:migrate`, `bun run db:seed`: apply Drizzle schema changes and seed data.

## Coding Style & Naming Conventions
TypeScript uses Biome with 2-space indentation, single quotes, semicolons, and trailing commas. Keep Nest classes and files aligned: `auth.controller.ts`, `auth.service.ts`, `auth.module.ts`, DTOs in `dto/`, guards in `guards/`, strategies in `strategies/`, and schemas in `schemas/`. Prefer explicit types on public methods and `type` imports where they improve clarity. Run `bun run format` before opening a PR.

## Testing Guidelines
Jest powers both unit and e2e tests. Keep unit tests beside the implementation as `*.spec.ts`; keep API-level flows in `test/*.e2e-spec.ts`. Add or update tests for controllers, guards, providers, and infrastructure adapters when behavior changes. Run `bun run test` before commit; use `bun run test:e2e` for auth, file upload, or request-pipeline changes.

## Commit & Pull Request Guidelines
Recent history follows Conventional Commit prefixes such as `feat:`, `docs:`, and `style:`. Use short, imperative summaries, for example `feat: add Swagger decorators to auth endpoints`. PRs should explain the change, call out config or env updates, link the relevant issue or plan doc, and include request/response examples or screenshots when Swagger, uploads, or admin surfaces change.

## Security & Configuration Tips
Environment files are split by mode: `.env.development`, `.env.test`, and `.env.production`; use `.env.example` as the starting point. `validateEnv()` enforces required settings at startup, so keep new variables in sync with `src/bootstrap/validation/env.schema.ts`. Do not commit secrets or generated artifacts from `dist/` or `coverage/`.
