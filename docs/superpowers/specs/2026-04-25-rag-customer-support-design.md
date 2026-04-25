# RAG Customer Support Chat Server Design

## Overview

Build a RAG-powered customer support server on the existing NestJS DDD bootstrap. The first version supports the project's own web/app chat API, stores chat history for audit and quality review, retrieves knowledge from uploaded documents and internal DB providers, and returns optional sources when requested.

The implementation will follow the existing modular-monolith structure and reuse current Auth, Users, JWT, and RBAC capabilities.

## Goals

- Provide customer-facing chat APIs backed by retrieval-augmented generation.
- Support both authenticated users and anonymous customer sessions.
- Store sessions, messages, retrieved sources, model metadata, and handoff signals.
- Allow admins to upload, list, reindex, and delete knowledge documents.
- Use PostgreSQL with `pgvector` for embedding storage and similarity search.
- Keep AI and embedding providers abstract, with OpenAI as the first adapter.
- Return source citations only when `includeSources=true`.

## Non-Goals

- 상담원 티켓/배정 시스템.
- Zendesk, Intercom, 채널톡 등 외부 고객센터 연동.
- WebSocket or token streaming.
- Multi-tenant organization/workspace support.
- Full PII governance workflow beyond a simple masking port.
- Dedicated async worker infrastructure in the first implementation.

## Architecture

Add three modules:

- `ai`: provider ports and OpenAI adapters.
- `knowledge`: document ingestion, chunking, embedding, indexing, and retrieval.
- `chat`: session/message persistence and RAG orchestration.

`chat` depends on `knowledge` retrieval ports and `ai` chat ports. `knowledge` depends on embedding provider ports. Domain/application code must depend on ports, not OpenAI or Drizzle directly.

## Data Model

Add tables:

- `knowledge_documents`: title, source type, source key, status, metadata, createdBy, timestamps.
- `knowledge_chunks`: document id, chunk index, content, metadata, embedding vector, timestamps.
- `knowledge_sync_jobs`: document/job type, status, error message, timestamps.
- `chat_sessions`: optional `userId`, anonymous session token hash, status, metadata, timestamps.
- `chat_messages`: session id, role, content, model, token usage, handoff fields, timestamps.
- `chat_message_sources`: assistant message id, source type, chunk/document ids, score, excerpt, metadata.

Internal DB retrieval starts as a `KnowledgeSourceProvider` port with a test/dummy provider. Concrete product/order providers can be added once those domains exist.

## APIs

Admin knowledge APIs require `ADMIN`:

- `POST /api/v1/knowledge/documents`
- `GET /api/v1/knowledge/documents`
- `POST /api/v1/knowledge/documents/:id/reindex`
- `DELETE /api/v1/knowledge/documents/:id`

Chat APIs:

- `POST /api/v1/chat/sessions`
- `POST /api/v1/chat/sessions/:sessionId/messages`
- `GET /api/v1/chat/sessions/:sessionId/messages`
- `POST /api/v1/chat/ask`

Responses include `answer`, `messageId`, `handoffRequired`, and optional `handoffReason`. `sources` is included only when requested with `includeSources=true`.

## RAG Flow

1. Validate session/user or anonymous session token.
2. Persist the user message.
3. Load recent context messages.
4. Mask basic sensitive data through a PII masking port.
5. Generate query embedding.
6. Retrieve top document chunks from pgvector and merge internal DB provider results.
7. If retrieval confidence is too low, return a handoff response.
8. Build a grounded prompt that instructs the model to answer only from retrieved evidence.
9. Generate the answer with the AI provider.
10. Persist assistant message, source rows, token usage, and handoff flags.

Default settings:

- `RAG_TOP_K=5`
- `RAG_MAX_CONTEXT_MESSAGES=8`
- `includeSources=false`
- `RAG_MIN_SCORE` required by env/config

## Configuration

Add env validation for:

- `OPENAI_API_KEY`
- `OPENAI_CHAT_MODEL`
- `OPENAI_EMBEDDING_MODEL`
- `RAG_TOP_K`
- `RAG_MIN_SCORE`
- `RAG_MAX_CONTEXT_MESSAGES`
- `CHAT_ANONYMOUS_SESSION_TTL`

Provider interfaces should make OpenAI replaceable without changing application use cases.

## Error Handling

- Low confidence/no knowledge: return `200` with `handoffRequired=true`.
- AI provider timeout/outage: return `503` or a controlled handoff response, and persist failure metadata.
- Indexing failure: mark `knowledge_sync_jobs.status=failed` with error message.
- Admin auth failure: use existing `401/403`.
- Invalid anonymous session token: return `401` or `404`, depending on whether the session id exists.

## Testing

Unit tests:

- Chunking and embedding persistence.
- Retrieval threshold and source ranking.
- Reindex job state transitions.
- Chat orchestration for source inclusion and handoff behavior.
- Provider contract tests with mocked OpenAI adapters.

E2E tests:

- Only `ADMIN` can manage knowledge documents.
- Document ingestion followed by chat answer stores messages and sources.
- `includeSources=true` controls source response visibility.
- Authenticated and anonymous chat sessions both work.
- Low retrieval score returns handoff signal.

## Implementation Notes

Use Drizzle migrations for `pgvector` extension and vector columns. If local/test PostgreSQL lacks `pgvector`, fail fast with a clear migration/config error rather than silently falling back to weak search.

Document upload can start with text/Markdown payloads. Binary PDF parsing may be added behind the same ingestion port after the first RAG loop works.
