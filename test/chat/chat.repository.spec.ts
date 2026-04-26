import { randomUUID } from "node:crypto";
import { eq, inArray, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SessionTokenService } from "../../src/modules/chat/application/session-token.service";
import {
  ChatMessageSourceTargetInvalidError,
  ChatSessionClosedError,
  ChatSessionNotFoundError,
} from "../../src/modules/chat/domain/chat.repository";
import { DrizzleChatRepository } from "../../src/modules/chat/infrastructure/chat.drizzle-repository";
import {
  chatMessageSources,
  chatMessages,
  chatSessions,
  schema,
  users,
} from "../../src/shared/infrastructure/database/schema";
import { migrateTestDatabase } from "../setup/test-database";
import "../setup/test-env";

const databaseUrl = process.env.DATABASE_URL;
const emailPrefix = `chat-repository-${randomUUID()}`;
const tokenPrefix = `chat-token-hash-${randomUUID()}`;

describe("DrizzleChatRepository", () => {
  let pool: Pool;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let repository: DrizzleChatRepository;
  const createdSessionIds = new Set<string>();

  beforeAll(() => {
    if (!databaseUrl?.includes("nestjs_bootstrap_test")) {
      throw new Error("Refusing to run chat repository tests against a non-test database");
    }

    migrateTestDatabase();
    pool = new Pool({ connectionString: databaseUrl });
    db = drizzle(pool, { schema });
    repository = new DrizzleChatRepository(db);
  });

  beforeEach(async () => {
    await cleanupCreatedSessions();
    await db.delete(users).where(like(users.email, `${emailPrefix}%`));
  });

  afterAll(async () => {
    if (db) {
      await cleanupCreatedSessions();
      await db.delete(users).where(like(users.email, `${emailPrefix}%`));
    }

    await pool?.end();
  });

  it("creates authenticated and anonymous sessions", async () => {
    const user = await createUser("sessions@example.com");
    const tokenPair = new SessionTokenService().generate();
    const anonymousTokenExpiresAt = new Date("2026-02-01T00:00:00.000Z");
    const authenticated = await createSession({
      userId: user.id,
      anonymousTokenExpiresAt,
      metadata: { channel: "account" },
    });
    const anonymous = await createSession({
      anonymousTokenHash: tokenPair.tokenHash,
      anonymousTokenExpiresAt,
      metadata: { channel: "public" },
    });

    expect(authenticated).toMatchObject({
      id: expect.any(String),
      userId: user.id,
      anonymousTokenHash: null,
      anonymousTokenExpiresAt: null,
      status: "active",
      metadata: { channel: "account" },
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
    expect(anonymous).toMatchObject({
      id: expect.any(String),
      userId: null,
      anonymousTokenHash: tokenPair.tokenHash,
      anonymousTokenExpiresAt,
      status: "active",
      metadata: { channel: "public" },
    });

    await expect(repository.findSession(authenticated.id)).resolves.toEqual(authenticated);
    await expect(repository.findSessionByAnonymousTokenHash(tokenPair.tokenHash)).resolves.toEqual(
      anonymous,
    );

    const [anonymousRow] = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, anonymous.id));
    expect(anonymousRow.anonymousTokenHash).toBe(tokenPair.tokenHash);
    expect(anonymousRow.anonymousTokenExpiresAt).toEqual(anonymousTokenExpiresAt);
    expect(JSON.stringify(anonymousRow)).not.toContain(tokenPair.plainToken);
  });

  it("appends messages and lists recent messages in chronological order", async () => {
    const session = await createSession({
      anonymousTokenHash: `${tokenPrefix}-messages`,
    });

    const first = await repository.createMessage({
      sessionId: session.id,
      role: "system",
      content: "Use support policy.",
    });
    const second = await repository.createMessage({
      sessionId: session.id,
      role: "user",
      content: "Can I get a refund?",
      metadata: { locale: "en" },
    });
    const third = await repository.createMessage({
      sessionId: session.id,
      role: "assistant",
      content: "Refunds are available within 7 days.",
      model: "gpt-5-mini",
      promptTokens: 12,
      completionTokens: 9,
      totalTokens: 21,
    });

    expect(third).toMatchObject({
      id: expect.any(String),
      sessionId: session.id,
      role: "assistant",
      content: "Refunds are available within 7 days.",
      model: "gpt-5-mini",
      promptTokens: 12,
      completionTokens: 9,
      totalTokens: 21,
      handoffRequested: false,
      handoffReason: null,
      metadata: {},
    });

    const recent = await repository.listRecentMessages(session.id, 2);

    expect(recent.map((message) => message.id)).toEqual([second.id, third.id]);
    expect(recent).not.toContainEqual(first);
  });

  it("attaches source rows to assistant messages", async () => {
    const session = await createSession({
      anonymousTokenHash: `${tokenPrefix}-sources`,
    });
    const message = await repository.createMessage({
      sessionId: session.id,
      role: "assistant",
      content: "Refunds are available within 7 days.",
    });

    await repository.attachSources(message.id, [
      {
        sourceType: "document",
        score: 0.92,
        excerpt: "Refunds within 7 days",
        metadata: { title: "Refund Policy" },
      },
    ]);

    const rows = await db
      .select()
      .from(chatMessageSources)
      .where(eq(chatMessageSources.assistantMessageId, message.id));

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      assistantMessageId: message.id,
      sourceType: "document",
      documentId: null,
      chunkId: null,
      score: 0.92,
      excerpt: "Refunds within 7 days",
      metadata: { title: "Refund Policy" },
    });
  });

  it("rejects attaching source rows to non-assistant messages", async () => {
    const session = await createSession({
      anonymousTokenHash: `${tokenPrefix}-invalid-source-target`,
    });
    const userMessage = await repository.createMessage({
      sessionId: session.id,
      role: "user",
      content: "Can I get a refund?",
    });
    const systemMessage = await repository.createMessage({
      sessionId: session.id,
      role: "system",
      content: "Use support policy.",
    });

    await expect(
      repository.attachSources(userMessage.id, [
        {
          sourceType: "document",
          score: 0.92,
          excerpt: "Refunds within 7 days",
        },
      ]),
    ).rejects.toBeInstanceOf(ChatMessageSourceTargetInvalidError);
    await expect(
      repository.attachSources(systemMessage.id, [
        {
          sourceType: "document",
          score: 0.92,
          excerpt: "Refunds within 7 days",
        },
      ]),
    ).rejects.toBeInstanceOf(ChatMessageSourceTargetInvalidError);
  });

  it("rejects appending messages for missing or closed sessions", async () => {
    const session = await createSession({
      anonymousTokenHash: `${tokenPrefix}-closed`,
    });
    await db.update(chatSessions).set({ status: "closed" }).where(eq(chatSessions.id, session.id));

    await expect(
      repository.createMessage({
        sessionId: randomUUID(),
        role: "user",
        content: "Hello?",
      }),
    ).rejects.toBeInstanceOf(ChatSessionNotFoundError);
    await expect(
      repository.createMessage({
        sessionId: session.id,
        role: "user",
        content: "Hello?",
      }),
    ).rejects.toBeInstanceOf(ChatSessionClosedError);

    const persistedMessages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, session.id));
    expect(persistedMessages).toHaveLength(0);
  });

  it("cascades messages and sources when deleting a tracked session", async () => {
    const session = await createSession({
      anonymousTokenHash: `${tokenPrefix}-cascade`,
    });
    const message = await repository.createMessage({
      sessionId: session.id,
      role: "assistant",
      content: "Refunds are available within 7 days.",
    });
    await repository.attachSources(message.id, [
      {
        sourceType: "document",
        score: 0.92,
        excerpt: "Refunds within 7 days",
      },
    ]);

    await db.delete(chatSessions).where(eq(chatSessions.id, session.id));
    createdSessionIds.delete(session.id);

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, session.id));
    const sources = await db
      .select()
      .from(chatMessageSources)
      .where(eq(chatMessageSources.assistantMessageId, message.id));
    expect(messages).toHaveLength(0);
    expect(sources).toHaveLength(0);
  });

  async function createSession(input: Parameters<DrizzleChatRepository["createSession"]>[0]) {
    const session = await repository.createSession(input);
    createdSessionIds.add(session.id);

    return session;
  }

  async function cleanupCreatedSessions() {
    const sessionIds = [...createdSessionIds];

    if (sessionIds.length === 0) {
      return;
    }

    await db.delete(chatSessions).where(inArray(chatSessions.id, sessionIds));
    createdSessionIds.clear();
  }

  async function createUser(emailSuffix: string) {
    const [user] = await db
      .insert(users)
      .values({
        email: `${emailPrefix}-${emailSuffix}`,
        displayName: "Chat Test User",
      })
      .returning();

    return user;
  }
});
