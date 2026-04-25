# RAG Customer Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a RAG-powered customer support chat API with PostgreSQL/pgvector retrieval, OpenAI-backed AI adapters, persisted chat history, optional source citations, and basic handoff signaling.

**Architecture:** Add `ai`, `knowledge`, and `chat` modules that follow the existing DDD module shape. Application services depend on provider/repository ports; infrastructure implements OpenAI, Drizzle, and pgvector details. Existing Auth/Users/JWT/RBAC modules remain the authorization boundary.

**Tech Stack:** NestJS, TypeScript, Drizzle ORM, PostgreSQL with pgvector, Redis-ready config, OpenAI Node SDK, Vitest, Supertest, Biome, Docker Compose.

---

## File Structure

- `src/modules/ai/`: AI and embedding provider ports plus OpenAI infrastructure adapter.
- `src/modules/knowledge/`: document/chunk domain types, chunking, indexing, retrieval, admin APIs.
- `src/modules/chat/`: chat session/message domain types, repositories, RAG orchestration, chat APIs.
- `src/shared/infrastructure/database/schema/index.ts`: new pgvector-backed knowledge/chat tables.
- `src/bootstrap/config/*`: OpenAI/RAG/chat env validation and config exposure.
- `test/ai`, `test/knowledge`, `test/chat`: unit and e2e coverage for provider contracts, indexing, retrieval, and chat APIs.

## References

- OpenAI JavaScript SDK uses `new OpenAI()` and `client.responses.create(...)` for model responses.
- OpenAI embeddings API uses `client.embeddings.create(...)` and returns float vectors.
- Drizzle already includes pgvector column support via `drizzle-orm/pg-core/columns/vector_extension`.

## Task 1: RAG Dependencies, Config, and pgvector Runtime

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `docker-compose.yml`
- Modify: `.env.example`
- Modify: `.env.test`
- Modify: `src/bootstrap/config/env.schema.ts`
- Modify: `src/bootstrap/config/configuration.ts`
- Test: `test/config/env.schema.spec.ts`

- [ ] **Step 1: Add failing config tests**

Add tests to `test/config/env.schema.spec.ts`:

```ts
it("parses rag and openai configuration", () => {
  const env = parseEnv({
    ...validEnv,
    OPENAI_API_KEY: "sk-test-key",
    OPENAI_CHAT_MODEL: "gpt-5-mini",
    OPENAI_EMBEDDING_MODEL: "text-embedding-3-small",
    RAG_TOP_K: "5",
    RAG_MIN_SCORE: "0.72",
    RAG_MAX_CONTEXT_MESSAGES: "8",
    CHAT_ANONYMOUS_SESSION_TTL: "30d",
  });

  expect(env.OPENAI_CHAT_MODEL).toBe("gpt-5-mini");
  expect(env.RAG_TOP_K).toBe(5);
  expect(env.RAG_MIN_SCORE).toBe(0.72);
});

it("rejects invalid rag retrieval settings", () => {
  expect(() =>
    parseEnv({
      ...validEnv,
      OPENAI_API_KEY: "sk-test-key",
      RAG_TOP_K: "0",
    }),
  ).toThrow("Invalid environment");

  expect(() =>
    parseEnv({
      ...validEnv,
      OPENAI_API_KEY: "sk-test-key",
      RAG_MIN_SCORE: "2",
    }),
  ).toThrow("Invalid environment");
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
pnpm test test/config/env.schema.spec.ts
```

Expected: FAIL because the new env vars are not defined.

- [ ] **Step 3: Add dependencies and runtime config**

Run:

```bash
pnpm add openai
```

Change `docker-compose.yml` PostgreSQL image:

```yaml
postgres:
  image: pgvector/pgvector:pg16
```

Add env values to `.env.example` and `.env.test`:

```env
OPENAI_API_KEY=sk-local-placeholder
OPENAI_CHAT_MODEL=gpt-5-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
RAG_TOP_K=5
RAG_MIN_SCORE=0.72
RAG_MAX_CONTEXT_MESSAGES=8
CHAT_ANONYMOUS_SESSION_TTL=30d
```

Add env validation in `src/bootstrap/config/env.schema.ts`:

```ts
const duration = z.string().trim().regex(/^\d+[smhd]$/);

OPENAI_API_KEY: nonBlankString,
OPENAI_CHAT_MODEL: nonBlankString.default("gpt-5-mini"),
OPENAI_EMBEDDING_MODEL: nonBlankString.default("text-embedding-3-small"),
RAG_TOP_K: z.coerce.number().int().min(1).max(20).default(5),
RAG_MIN_SCORE: z.coerce.number().min(0).max(1).default(0.72),
RAG_MAX_CONTEXT_MESSAGES: z.coerce.number().int().min(0).max(30).default(8),
CHAT_ANONYMOUS_SESSION_TTL: duration.default("30d"),
```

Expose in `configuration()`:

```ts
ai: {
  openAiApiKey: env.OPENAI_API_KEY,
  chatModel: env.OPENAI_CHAT_MODEL,
  embeddingModel: env.OPENAI_EMBEDDING_MODEL,
},
rag: {
  topK: env.RAG_TOP_K,
  minScore: env.RAG_MIN_SCORE,
  maxContextMessages: env.RAG_MAX_CONTEXT_MESSAGES,
},
chat: {
  anonymousSessionTtl: env.CHAT_ANONYMOUS_SESSION_TTL,
},
```

- [ ] **Step 4: Verify and commit**

Run:

```bash
pnpm test test/config/env.schema.spec.ts
pnpm build
pnpm lint
pnpm format:check
```

Commit:

```bash
git add package.json pnpm-lock.yaml docker-compose.yml .env.example .env.test src/bootstrap/config test/config
git commit -m "feat: add rag ai configuration"
```

## Task 2: Database Schema for Knowledge and Chat

**Files:**
- Modify: `src/shared/infrastructure/database/schema/index.ts`
- Create: generated migration under `src/shared/infrastructure/database/migrations/`
- Test: `test/database/rag-schema.spec.ts`

- [ ] **Step 1: Add schema tests**

Create `test/database/rag-schema.spec.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  chatMessages,
  chatMessageSources,
  chatSessions,
  knowledgeChunks,
  knowledgeDocuments,
  knowledgeSyncJobs,
} from "../../src/shared/infrastructure/database/schema";

describe("rag database schema", () => {
  it("exports knowledge and chat tables", () => {
    expect(knowledgeDocuments).toBeDefined();
    expect(knowledgeChunks).toBeDefined();
    expect(knowledgeSyncJobs).toBeDefined();
    expect(chatSessions).toBeDefined();
    expect(chatMessages).toBeDefined();
    expect(chatMessageSources).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
pnpm test test/database/rag-schema.spec.ts
```

Expected: FAIL because the tables are not exported.

- [ ] **Step 3: Add schema**

Add enums and tables to `schema/index.ts`:

```ts
import { jsonb, integer, real } from "drizzle-orm/pg-core";
import { vector } from "drizzle-orm/pg-core/columns/vector_extension";

export const knowledgeDocumentStatus = pgEnum("knowledge_document_status", [
  "active",
  "inactive",
  "indexing",
  "failed",
]);
export const knowledgeSourceType = pgEnum("knowledge_source_type", ["document", "internal_db"]);
export const knowledgeSyncJobStatus = pgEnum("knowledge_sync_job_status", [
  "pending",
  "running",
  "succeeded",
  "failed",
]);
export const chatSessionStatus = pgEnum("chat_session_status", ["active", "closed"]);
export const chatMessageRole = pgEnum("chat_message_role", ["user", "assistant", "system"]);

export const knowledgeDocuments = pgTable("knowledge_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 200 }).notNull(),
  sourceType: knowledgeSourceType("source_type").notNull().default("document"),
  sourceKey: varchar("source_key", { length: 300 }).notNull(),
  status: knowledgeDocumentStatus("status").notNull().default("indexing"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  ...timestampColumns(),
});

export const knowledgeChunks = pgTable(
  "knowledge_chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => knowledgeDocuments.id, { onDelete: "cascade" }),
    chunkIndex: integer("chunk_index").notNull(),
    content: text("content").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
    ...timestampColumns(),
  },
  (table) => [
    index("knowledge_chunks_document_id_idx").on(table.documentId),
    index("knowledge_chunks_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
  ],
);
```

Also add `knowledgeSyncJobs`, `chatSessions`, `chatMessages`, and `chatMessageSources` with the fields named in the design spec. Store anonymous session token hashes in `chatSessions.anonymousTokenHash`.

Manually add a migration statement for pgvector before generated table creation:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

- [ ] **Step 4: Generate migration and verify**

Run:

```bash
pnpm db:generate
pnpm test test/database/rag-schema.spec.ts
pnpm build
pnpm lint
pnpm format:check
```

Commit:

```bash
git add src/shared/infrastructure/database test/database
git commit -m "feat: add rag database schema"
```

## Task 3: AI Provider Ports and OpenAI Adapter

**Files:**
- Create: `src/modules/ai/domain/ai-chat.provider.ts`
- Create: `src/modules/ai/domain/embedding.provider.ts`
- Create: `src/modules/ai/infrastructure/openai-ai.provider.ts`
- Create: `src/modules/ai/ai.module.ts`
- Modify: `src/app.module.ts`
- Test: `test/ai/openai-ai.provider.spec.ts`

- [ ] **Step 1: Write provider contract tests**

Create `test/ai/openai-ai.provider.spec.ts` with a fake OpenAI client:

```ts
import { describe, expect, it } from "vitest";
import { OpenAiProvider } from "../../src/modules/ai/infrastructure/openai-ai.provider";

describe("OpenAiProvider", () => {
  it("creates embeddings through the configured model", async () => {
    const provider = new OpenAiProvider(fakeConfig(), {
      embeddings: {
        create: async (input: unknown) => ({
          data: [{ embedding: [0.1, 0.2, 0.3] }],
          usage: { prompt_tokens: 3, total_tokens: 3 },
          input,
        }),
      },
      responses: { create: async () => ({ output_text: "unused" }) },
    } as never);

    await expect(provider.embed("refund policy")).resolves.toEqual({
      embedding: [0.1, 0.2, 0.3],
      tokenUsage: { promptTokens: 3, totalTokens: 3 },
    });
  });

  it("generates a grounded chat answer", async () => {
    const provider = new OpenAiProvider(fakeConfig(), {
      embeddings: { create: async () => ({ data: [] }) },
      responses: {
        create: async () => ({
          output_text: "You can request a refund within 7 days.",
          usage: { input_tokens: 10, output_tokens: 8, total_tokens: 18 },
        }),
      },
    } as never);

    const result = await provider.generateAnswer({
      systemPrompt: "Answer only from sources.",
      messages: [{ role: "user", content: "Refund?" }],
    });

    expect(result.answer).toContain("refund");
    expect(result.tokenUsage.totalTokens).toBe(18);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
pnpm test test/ai/openai-ai.provider.spec.ts
```

Expected: FAIL because module/provider files do not exist.

- [ ] **Step 3: Implement ports and adapter**

Define ports:

```ts
export const AI_CHAT_PROVIDER = Symbol("AI_CHAT_PROVIDER");

export type AiChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type GenerateAnswerInput = {
  systemPrompt: string;
  messages: AiChatMessage[];
};

export type GenerateAnswerResult = {
  answer: string;
  tokenUsage: { inputTokens: number; outputTokens: number; totalTokens: number };
};

export interface AiChatProvider {
  generateAnswer(input: GenerateAnswerInput): Promise<GenerateAnswerResult>;
}
```

```ts
export const EMBEDDING_PROVIDER = Symbol("EMBEDDING_PROVIDER");

export type EmbeddingResult = {
  embedding: number[];
  tokenUsage: { promptTokens: number; totalTokens: number };
};

export interface EmbeddingProvider {
  embed(input: string): Promise<EmbeddingResult>;
}
```

Implement `OpenAiProvider` using the official OpenAI SDK:

```ts
import OpenAI from "openai";

const response = await this.client.responses.create({
  model: this.config.getOrThrow<string>("ai.chatModel"),
  instructions: input.systemPrompt,
  input: input.messages.map((message) => ({
    role: message.role === "assistant" ? "assistant" : "user",
    content: message.content,
  })),
});
```

Use `client.embeddings.create({ model, input, encoding_format: "float" })`.

- [ ] **Step 4: Wire module and verify**

Run:

```bash
pnpm test test/ai/openai-ai.provider.spec.ts
pnpm build
pnpm lint
pnpm format:check
```

Commit:

```bash
git add src/modules/ai src/app.module.ts test/ai
git commit -m "feat: add ai provider ports"
```

## Task 4: Knowledge Domain, Repositories, and Chunking

**Files:**
- Create: `src/modules/knowledge/domain/knowledge.types.ts`
- Create: `src/modules/knowledge/domain/knowledge.repository.ts`
- Create: `src/modules/knowledge/application/chunk-text.ts`
- Create: `src/modules/knowledge/infrastructure/knowledge.drizzle-repository.ts`
- Create: `src/modules/knowledge/knowledge.module.ts`
- Test: `test/knowledge/chunk-text.spec.ts`
- Test: `test/knowledge/knowledge.repository.spec.ts`

- [ ] **Step 1: Write chunking tests**

Create `test/knowledge/chunk-text.spec.ts`:

```ts
import { describe, expect, it } from "vitest";
import { chunkText } from "../../src/modules/knowledge/application/chunk-text";

describe("chunkText", () => {
  it("splits text into overlapping chunks", () => {
    const chunks = chunkText("one two three four five six", {
      maxWords: 3,
      overlapWords: 1,
    });

    expect(chunks.map((chunk) => chunk.content)).toEqual([
      "one two three",
      "three four five",
      "five six",
    ]);
  });

  it("drops blank chunks", () => {
    expect(chunkText("   \n\n  ", { maxWords: 3, overlapWords: 1 })).toEqual([]);
  });
});
```

- [ ] **Step 2: Write repository tests**

Create `test/knowledge/knowledge.repository.spec.ts` covering document creation, chunk replacement, job status update, and document listing. Use the existing `migrateTestDatabase()` and `DATABASE_URL` safety pattern from repository tests.

- [ ] **Step 3: Run tests to verify failure**

Run:

```bash
pnpm test test/knowledge/chunk-text.spec.ts test/knowledge/knowledge.repository.spec.ts
```

Expected: FAIL because files do not exist.

- [ ] **Step 4: Implement domain and repository**

Repository port:

```ts
export const KNOWLEDGE_REPOSITORY = Symbol("KNOWLEDGE_REPOSITORY");

export type CreateKnowledgeDocumentInput = {
  title: string;
  sourceType: "document" | "internal_db";
  sourceKey: string;
  metadata?: Record<string, unknown>;
  createdBy?: string | null;
};

export interface KnowledgeRepository {
  createDocument(input: CreateKnowledgeDocumentInput): Promise<KnowledgeDocument>;
  listDocuments(input: { page: number; limit: number }): Promise<PageResult<KnowledgeDocument>>;
  markDocumentStatus(id: string, status: KnowledgeDocumentStatus): Promise<KnowledgeDocument>;
  replaceChunks(documentId: string, chunks: CreateKnowledgeChunkInput[]): Promise<KnowledgeChunk[]>;
  createSyncJob(input: CreateKnowledgeSyncJobInput): Promise<KnowledgeSyncJob>;
  completeSyncJob(id: string): Promise<KnowledgeSyncJob>;
  failSyncJob(id: string, errorMessage: string): Promise<KnowledgeSyncJob>;
}
```

Chunking implementation:

```ts
export function chunkText(
  text: string,
  options: { maxWords: number; overlapWords: number },
): Array<{ content: string; chunkIndex: number }> {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const chunks: Array<{ content: string; chunkIndex: number }> = [];
  const step = Math.max(1, options.maxWords - options.overlapWords);

  for (let start = 0; start < words.length; start += step) {
    const content = words.slice(start, start + options.maxWords).join(" ");
    chunks.push({ content, chunkIndex: chunks.length });
    if (start + options.maxWords >= words.length) break;
  }

  return chunks;
}
```

- [ ] **Step 5: Verify and commit**

Run:

```bash
pnpm test test/knowledge/chunk-text.spec.ts test/knowledge/knowledge.repository.spec.ts
pnpm build
pnpm lint
pnpm format:check
```

Commit:

```bash
git add src/modules/knowledge test/knowledge
git commit -m "feat: add knowledge repository"
```

## Task 5: Knowledge Indexing and Retrieval

**Files:**
- Create: `src/modules/knowledge/application/index-knowledge-document.ts`
- Create: `src/modules/knowledge/application/retrieve-knowledge.ts`
- Create: `src/modules/knowledge/domain/knowledge-source.provider.ts`
- Modify: `src/modules/knowledge/domain/knowledge.repository.ts`
- Modify: `src/modules/knowledge/infrastructure/knowledge.drizzle-repository.ts`
- Test: `test/knowledge/index-knowledge-document.spec.ts`
- Test: `test/knowledge/retrieve-knowledge.spec.ts`

- [ ] **Step 1: Write indexing test**

Create `test/knowledge/index-knowledge-document.spec.ts` with fake embedding provider:

```ts
it("chunks, embeds, stores chunks, and marks the document active", async () => {
  const repository = new InMemoryKnowledgeRepository();
  const document = await repository.createDocument({
    title: "Refund Policy",
    sourceType: "document",
    sourceKey: "refund.md",
  });
  const useCase = new IndexKnowledgeDocument(repository, {
    embed: async (text) => ({
      embedding: text.includes("refund") ? [1, 0, 0] : [0, 1, 0],
      tokenUsage: { promptTokens: 1, totalTokens: 1 },
    }),
  });

  await useCase.execute({
    documentId: document.id,
    content: "Refunds are available within seven days.",
  });

  expect(repository.chunksFor(document.id)).toHaveLength(1);
  expect((await repository.findDocument(document.id))?.status).toBe("active");
});
```

- [ ] **Step 2: Write retrieval test**

Create `test/knowledge/retrieve-knowledge.spec.ts`:

```ts
it("returns handoff-worthy empty results when all scores are below threshold", async () => {
  const retriever = new RetrieveKnowledge(
    fakeRepositoryWithScores([{ content: "Shipping only", score: 0.2 }]),
    { embed: async () => ({ embedding: [1, 0, 0], tokenUsage: { promptTokens: 1, totalTokens: 1 } }) },
    [],
    { topK: 5, minScore: 0.72 },
  );

  await expect(retriever.execute({ question: "Refund?" })).resolves.toMatchObject({
    results: [],
    lowConfidence: true,
  });
});
```

- [ ] **Step 3: Implement retrieval contracts**

Add to repository:

```ts
searchChunksByEmbedding(input: {
  embedding: number[];
  topK: number;
  minScore: number;
}): Promise<KnowledgeSearchResult[]>;
```

Drizzle search SQL:

```ts
const distance = sql<number>`${knowledgeChunks.embedding} <=> ${JSON.stringify(input.embedding)}`;
const score = sql<number>`1 - (${distance})`;
```

Return rows where score is at least `minScore`, ordered by distance ascending.

Define internal DB source port:

```ts
export interface KnowledgeSourceProvider {
  search(input: { question: string; topK: number }): Promise<KnowledgeSearchResult[]>;
}
```

- [ ] **Step 4: Verify and commit**

Run:

```bash
pnpm test test/knowledge/index-knowledge-document.spec.ts test/knowledge/retrieve-knowledge.spec.ts test/knowledge/knowledge.repository.spec.ts
pnpm build
pnpm lint
pnpm format:check
```

Commit:

```bash
git add src/modules/knowledge test/knowledge
git commit -m "feat: add knowledge indexing retrieval"
```

## Task 6: Knowledge Admin API

**Files:**
- Create: `src/modules/knowledge/presentation/knowledge-admin.controller.ts`
- Create: `src/modules/knowledge/presentation/knowledge.dto.ts`
- Modify: `src/modules/knowledge/knowledge.module.ts`
- Modify: `src/app.module.ts`
- Test: `test/knowledge/knowledge-admin.e2e-spec.ts`

- [ ] **Step 1: Write e2e tests**

Create tests for admin-only document creation and reindex:

```ts
it("allows admins to create a text knowledge document", async () => {
  const admin = await createAdminUser(db);
  const token = await createAccessToken({ userId: admin.id, role: "ADMIN" });

  const response = await request(app.getHttpServer())
    .post("/api/v1/knowledge/documents")
    .set("authorization", `Bearer ${token}`)
    .send({
      title: "Refund Policy",
      sourceKey: "refund-policy",
      content: "Refunds are available within seven days.",
      metadata: { category: "policy" },
    })
    .expect(201);

  expect(response.body.data).toMatchObject({
    title: "Refund Policy",
    status: "active",
  });
});

it("forbids non-admin users from creating knowledge documents", async () => {
  const user = await createRegularUser(db);
  const token = await createAccessToken({ userId: user.id, role: "USER" });

  await request(app.getHttpServer())
    .post("/api/v1/knowledge/documents")
    .set("authorization", `Bearer ${token}`)
    .send({ title: "Policy", sourceKey: "policy", content: "Policy text" })
    .expect(403);
});
```

- [ ] **Step 2: Implement DTOs and controller**

DTOs:

```ts
export class CreateKnowledgeDocumentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(300)
  sourceKey!: string;

  @IsString()
  @MinLength(1)
  content!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
```

Controller:

```ts
@Controller({ path: "knowledge/documents", version: "1" })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class KnowledgeAdminController {
  @Post()
  async create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateKnowledgeDocumentDto) {
    return this.createKnowledgeDocument.execute({ ...body, createdBy: user.id });
  }
}
```

- [ ] **Step 3: Verify and commit**

Run:

```bash
pnpm test:e2e test/knowledge/knowledge-admin.e2e-spec.ts
pnpm test
pnpm test:e2e
pnpm build
pnpm lint
pnpm format:check
```

Commit:

```bash
git add src/modules/knowledge src/app.module.ts test/knowledge
git commit -m "feat: add knowledge admin api"
```

## Task 7: Chat Domain and Persistence

**Files:**
- Create: `src/modules/chat/domain/chat.types.ts`
- Create: `src/modules/chat/domain/chat.repository.ts`
- Create: `src/modules/chat/infrastructure/chat.drizzle-repository.ts`
- Create: `src/modules/chat/application/session-token.service.ts`
- Create: `src/modules/chat/chat.module.ts`
- Test: `test/chat/chat.repository.spec.ts`
- Test: `test/chat/session-token.service.spec.ts`

- [ ] **Step 1: Write session token tests**

Create `test/chat/session-token.service.spec.ts`:

```ts
it("returns a plain anonymous token and stores only a hash", () => {
  const service = new SessionTokenService();
  const pair = service.generate();

  expect(pair.plainToken).toMatch(/^[A-Za-z0-9_-]+$/);
  expect(pair.tokenHash).not.toBe(pair.plainToken);
  expect(service.hash(pair.plainToken)).toBe(pair.tokenHash);
});
```

- [ ] **Step 2: Write repository tests**

Cover:

- create authenticated session with `userId`.
- create anonymous session with `anonymousTokenHash`.
- append user and assistant messages.
- attach source rows to assistant message.
- reject message append for closed sessions.

- [ ] **Step 3: Implement repository port**

```ts
export const CHAT_REPOSITORY = Symbol("CHAT_REPOSITORY");

export interface ChatRepository {
  createSession(input: CreateChatSessionInput): Promise<ChatSession>;
  findSession(id: string): Promise<ChatSession | null>;
  findSessionByAnonymousTokenHash(hash: string): Promise<ChatSession | null>;
  listRecentMessages(sessionId: string, limit: number): Promise<ChatMessage[]>;
  createMessage(input: CreateChatMessageInput): Promise<ChatMessage>;
  attachSources(messageId: string, sources: CreateChatMessageSourceInput[]): Promise<void>;
}
```

- [ ] **Step 4: Verify and commit**

Run:

```bash
pnpm test test/chat/session-token.service.spec.ts test/chat/chat.repository.spec.ts
pnpm build
pnpm lint
pnpm format:check
```

Commit:

```bash
git add src/modules/chat test/chat
git commit -m "feat: add chat persistence"
```

## Task 8: Chat RAG Orchestration

**Files:**
- Create: `src/modules/chat/application/pii-masker.ts`
- Create: `src/modules/chat/application/chat.use-cases.ts`
- Create: `src/modules/chat/application/chat.response.ts`
- Modify: `src/modules/chat/chat.module.ts`
- Test: `test/chat/chat-rag.use-case.spec.ts`

- [ ] **Step 1: Write orchestration tests**

Create `test/chat/chat-rag.use-case.spec.ts`:

```ts
it("returns a handoff response when retrieval confidence is low", async () => {
  const useCase = createUseCase({
    retrieve: async () => ({ results: [], lowConfidence: true }),
  });

  const result = await useCase.execute({
    sessionId: "session-1",
    message: "Can I refund a custom order?",
    includeSources: false,
  });

  expect(result).toMatchObject({
    handoffRequired: true,
    handoffReason: "LOW_RETRIEVAL_CONFIDENCE",
  });
});

it("includes sources only when requested", async () => {
  const useCase = createUseCase({
    retrieve: async () => ({
      lowConfidence: false,
      results: [{ sourceType: "document", content: "Refunds within 7 days", score: 0.9 }],
    }),
    answer: async () => ({ answer: "Refunds are available within 7 days." }),
  });

  await expect(
    useCase.execute({ sessionId: "session-1", message: "Refund?", includeSources: true }),
  ).resolves.toMatchObject({
    answer: "Refunds are available within 7 days.",
    sources: [expect.objectContaining({ score: 0.9 })],
  });
});
```

- [ ] **Step 2: Implement PII masking port**

```ts
export const PII_MASKER = Symbol("PII_MASKER");

export interface PiiMasker {
  mask(input: string): string;
}

export class BasicPiiMasker implements PiiMasker {
  mask(input: string): string {
    return input
      .replaceAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
      .replaceAll(/\b\d{2,3}-\d{3,4}-\d{4}\b/g, "[phone]");
  }
}
```

- [ ] **Step 3: Implement use cases**

Use cases:

```text
CreateChatSession
SendChatMessage
GetChatMessages
AskOnce
```

Prompt rule:

```text
You are a customer support assistant. Answer only from the provided sources.
If sources do not contain enough evidence, say that a human support agent should review it.
Do not invent policies, prices, order status, or refund decisions.
```

- [ ] **Step 4: Verify and commit**

Run:

```bash
pnpm test test/chat/chat-rag.use-case.spec.ts
pnpm build
pnpm lint
pnpm format:check
```

Commit:

```bash
git add src/modules/chat test/chat
git commit -m "feat: add chat rag orchestration"
```

## Task 9: Chat API

**Files:**
- Create: `src/modules/chat/presentation/chat.controller.ts`
- Create: `src/modules/chat/presentation/chat.dto.ts`
- Modify: `src/modules/chat/chat.module.ts`
- Modify: `src/app.module.ts`
- Test: `test/chat/chat.e2e-spec.ts`

- [ ] **Step 1: Write e2e tests**

Create `test/chat/chat.e2e-spec.ts`:

```ts
it("supports anonymous chat sessions", async () => {
  const session = await request(app.getHttpServer())
    .post("/api/v1/chat/sessions")
    .send({ anonymous: true })
    .expect(201);

  const response = await request(app.getHttpServer())
    .post(`/api/v1/chat/sessions/${session.body.data.id}/messages`)
    .set("x-chat-session-token", session.body.data.sessionToken)
    .send({ message: "What is the refund policy?", includeSources: false })
    .expect(201);

  expect(response.body.data).toMatchObject({
    messageId: expect.any(String),
    answer: expect.any(String),
    handoffRequired: expect.any(Boolean),
  });
  expect(response.body.data.sources).toBeUndefined();
});

it("returns sources when includeSources is true", async () => {
  const response = await sendSeededQuestion({ includeSources: true });

  expect(response.body.data.sources).toEqual([
    expect.objectContaining({
      sourceType: "document",
      score: expect.any(Number),
      excerpt: expect.any(String),
    }),
  ]);
});
```

- [ ] **Step 2: Implement DTOs and controller**

DTOs:

```ts
export class SendChatMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  message!: string;

  @IsOptional()
  @IsBoolean()
  includeSources = false;
}
```

Controller:

```ts
@Controller({ path: "chat", version: "1" })
export class ChatController {
  @Post("sessions")
  async createSession(@CurrentUser() user?: AuthenticatedUser) {
    return this.createChatSession.execute({ userId: user?.id ?? null });
  }

  @Post("sessions/:sessionId/messages")
  async sendMessage(
    @Param("sessionId", ParseUUIDPipe) sessionId: string,
    @Headers("x-chat-session-token") token: string | undefined,
    @Body() body: SendChatMessageDto,
  ) {
    return this.sendChatMessage.execute({ sessionId, anonymousToken: token, ...body });
  }
}
```

Use JWT if present, but do not require it for anonymous session routes. Add a small optional-auth guard only if Nest parameter decorators need a consistent current user shape.

- [ ] **Step 3: Verify and commit**

Run:

```bash
pnpm test:e2e test/chat/chat.e2e-spec.ts
pnpm test
pnpm test:e2e
pnpm build
pnpm lint
pnpm format:check
```

Commit:

```bash
git add src/modules/chat src/app.module.ts test/chat
git commit -m "feat: add rag chat api"
```

## Task 10: Documentation and Final Verification

**Files:**
- Modify: `README.md`
- Modify: `.env.example`
- Modify: `AGENTS.md` if command/module guidance changes
- Test: all tests

- [ ] **Step 1: Update README**

Add:

```md
## RAG Customer Support

Knowledge admins can upload and reindex support content under `/api/v1/knowledge`.
Chat clients create sessions under `/api/v1/chat/sessions` and send messages to
`/api/v1/chat/sessions/:sessionId/messages`.

Set `OPENAI_API_KEY`, `OPENAI_CHAT_MODEL`, `OPENAI_EMBEDDING_MODEL`, `RAG_TOP_K`,
`RAG_MIN_SCORE`, `RAG_MAX_CONTEXT_MESSAGES`, and `CHAT_ANONYMOUS_SESSION_TTL`.

Local PostgreSQL uses the `pgvector/pgvector:pg16` image because embeddings are stored in
PostgreSQL vector columns.
```

- [ ] **Step 2: Run final verification**

Run:

```bash
pnpm db:generate
pnpm build
pnpm lint
pnpm format:check
pnpm test
pnpm test:e2e
docker build -t nestjs-bootstrap:local .
docker compose up -d postgres redis
docker compose run --rm app pnpm db:migrate:prod
```

Expected:

- No unexpected migration files after the final `pnpm db:generate`.
- All checks pass.
- Docker migration can create the `vector` extension and RAG tables.

- [ ] **Step 3: Commit**

```bash
git add README.md .env.example AGENTS.md src/modules src/bootstrap src/shared/infrastructure/database test package.json pnpm-lock.yaml docker-compose.yml .env.test
git commit -m "docs: document rag customer support workflow"
```

## Final Review Checklist

- [ ] Admin knowledge APIs require `ADMIN`.
- [ ] Anonymous chat session tokens are hashed at rest.
- [ ] Chat responses include sources only when requested.
- [ ] Low confidence retrieval returns `handoffRequired=true`.
- [ ] OpenAI is replaceable through provider ports.
- [ ] pgvector migration fails clearly if the runtime image lacks extension support.
- [ ] `PRD.md` deletion is not staged unless the user explicitly wants it included in this feature branch.
