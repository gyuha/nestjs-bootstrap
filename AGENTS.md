# Repository Guidelines

## Project Structure & Module Organization

This is a NestJS modular-monolith bootstrap with DDD-oriented boundaries. Source code lives in `src/`.

- `src/bootstrap/`: app startup concerns such as config, Swagger, validation, security, and logging.
- `src/shared/`: reusable infrastructure and presentation utilities, including Drizzle/PostgreSQL with pgvector, Redis, response envelopes, and exception filters.
- `src/modules/`: feature modules. Current modules: `ai`, `auth`, `chat`, `health`, `knowledge`, and `users`. Future modules should follow `modules/<domain>/{domain,application,infrastructure,presentation}`.
- `test/`: unit and e2e tests. Shared test setup lives in `test/setup/`.
- Database schema and migrations live under `src/shared/infrastructure/database/`.

## Build, Test, and Development Commands

Use pnpm `10.28.2`.

- `pnpm dev`: run NestJS in watch mode.
- `pnpm build`: compile the app to `dist/`.
- `pnpm start`: run the compiled app.
- `pnpm lint`: run Biome linting.
- `pnpm format` / `pnpm format:check`: write or check Biome formatting.
- `pnpm test`: run unit tests with Vitest.
- `pnpm test:e2e`: run e2e tests with Vitest and Supertest.
- `pnpm db:generate`: generate Drizzle migrations.
- `pnpm db:migrate`: run local TypeScript migrations.
- `pnpm db:migrate:prod`: run compiled migrations after `pnpm build`.
- `pnpm docker:up` / `pnpm docker:down`: start or stop the compose stack.
- `docker compose run --rm app pnpm db:migrate:prod`: run compiled migrations in compose after building the app image.

## Coding Style & Naming Conventions

TypeScript is strict and CommonJS-based. Biome enforces formatting with 2-space indentation and 100-character line width. Prefer focused files with one clear responsibility. Use Nest naming patterns such as `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.provider.ts`, and `*.spec.ts`.

Avoid leaking infrastructure into domain/application code. Domain modules should depend on repository or provider ports, not Drizzle, Redis, or OpenAI directly.

## Testing Guidelines

Unit tests use `*.spec.ts`; e2e tests use `*.e2e-spec.ts`. Keep deterministic tests in `test/`, and reusable helpers in `test/setup/`. Mock external dependencies unless the test explicitly verifies integration behavior. Run `pnpm test`, `pnpm test:e2e`, and `pnpm build` before handing off changes.

## Commit & Pull Request Guidelines

Commits follow Conventional Commits, enforced by Commitlint and Husky. Examples: `feat: add redis provider`, `fix: harden docker workflow`, `chore: add quality workflow`.

Pull requests should include a short summary, test results, migration or config changes, and any Docker/operations impact. Link related issues when applicable.

## Security & Configuration Tips

Copy `.env.example` to `.env` for local development. Swagger defaults to local/test only unless explicitly enabled. Startup migrations are allowed only in `local` and `test`; production should use `pnpm db:migrate:prod` or a deployment job.
