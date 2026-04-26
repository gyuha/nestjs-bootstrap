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

## Authentication and Users

Auth is exposed under `/api/v1/auth`; user profile/admin APIs are exposed under
`/api/v1/users`.

Auth environment variables:

- `JWT_ACCESS_TOKEN_SECRET`: HMAC secret for access tokens. Must be at least 32 characters.
- `JWT_ACCESS_TOKEN_EXPIRES_IN`: access token TTL, such as `15m`.
- `REFRESH_TOKEN_EXPIRES_IN`: refresh token TTL, such as `30d`.
- `GOOGLE_CLIENT_ID`: Google OAuth client ID.
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret.
- `GOOGLE_CALLBACK_URL`: OAuth callback URL. Locally this is
  `http://localhost:3000/api/v1/auth/google/callback`.

Password auth:

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H 'content-type: application/json' \
  -d '{"email":"jane@example.com","password":"correct-horse-battery-staple","displayName":"Jane Example"}'

curl -X POST http://localhost:3000/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"jane@example.com","password":"correct-horse-battery-staple"}'
```

Both endpoints return an access token, refresh token, and user profile. Use the access token as a
bearer token for protected routes:

```bash
curl http://localhost:3000/api/v1/auth/me \
  -H "authorization: Bearer $ACCESS_TOKEN"
```

Refresh and logout:

```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H 'content-type: application/json' \
  -d '{"refreshToken":"..."}'

curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H 'content-type: application/json' \
  -d '{"refreshToken":"..."}'
```

Refresh rotates tokens: store the replacement refresh token and discard the previous one. Logout
revokes the submitted refresh token.

Google OAuth:

1. Create an OAuth 2.0 client in Google Cloud Console.
2. Add `GOOGLE_CALLBACK_URL` as an authorized redirect URI.
3. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL` in `.env`.
4. Start login at `GET /api/v1/auth/google`.

Roles:

- `USER`: can access their own profile through `GET/PATCH /api/v1/users/me`.
- `ADMIN`: can access user administration routes under `/api/v1/users`.

## RAG Customer Support

Knowledge admins can create and index support content under `/api/v1/knowledge`; document
indexing is exposed at `POST /api/v1/knowledge/documents` and requires the `ADMIN` role.

Chat clients create sessions under `POST /api/v1/chat/sessions` and send messages to
`POST /api/v1/chat/sessions/:sessionId/messages`. Authenticated sessions use the bearer token.
Anonymous sessions return a one-time plain session token; send it back in
`x-chat-session-token` when posting messages.

Set these environment variables for RAG and OpenAI-backed chat:

- `OPENAI_API_KEY`
- `OPENAI_CHAT_MODEL`
- `OPENAI_EMBEDDING_MODEL`
- `RAG_TOP_K`
- `RAG_MIN_SCORE`
- `RAG_MAX_CONTEXT_MESSAGES`
- `CHAT_ANONYMOUS_SESSION_TTL`

Local PostgreSQL uses the `pgvector/pgvector:pg16` image because embeddings are stored in
PostgreSQL vector columns.

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
docker build -t nestjs-bootstrap:local .
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

`pnpm db:migrate` is the local TypeScript runner. `pnpm db:migrate:prod` runs the compiled migration runner from `dist`, so run `pnpm build` first when using it outside containers. Startup migrations are allowed only in `local` and `test`; compose and production should run migrations through an explicit command or separate deployment job.
