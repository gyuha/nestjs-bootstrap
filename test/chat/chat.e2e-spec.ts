import { randomUUID } from "node:crypto";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { eq, inArray } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { AppModule } from "../../src/app.module";
import { applyBootstrap } from "../../src/bootstrap/apply-bootstrap";
import { AI_CHAT_PROVIDER } from "../../src/modules/ai/domain/ai-chat.provider";
import type { AiChatProvider } from "../../src/modules/ai/domain/ai-chat.provider";
import { RetrieveKnowledge } from "../../src/modules/knowledge/application/retrieve-knowledge";
import type { RetrieveKnowledgeResult } from "../../src/modules/knowledge/application/retrieve-knowledge";
import { DATABASE } from "../../src/shared/infrastructure/database/database.tokens";
import { chatSessions, type schema } from "../../src/shared/infrastructure/database/schema";
import { migrateTestDatabase } from "../setup/test-database";
import "../setup/test-env";

const seededSource = {
  sourceType: "document" as const,
  sourceKey: `chat-e2e-source-${randomUUID()}`,
  title: "Refund Policy",
  score: 0.91,
  content: "Refunds are available within seven days.",
  metadata: { category: "policy" },
};

describe("Chat API", () => {
  let app: INestApplication;
  let db: NodePgDatabase<typeof schema>;
  let retrieveKnowledge: Pick<RetrieveKnowledge, "execute">;
  let aiChatProvider: AiChatProvider;
  const sessionIds: string[] = [];

  beforeAll(async () => {
    migrateTestDatabase();

    retrieveKnowledge = {
      execute: vi.fn(async (): Promise<RetrieveKnowledgeResult> => {
        return {
          results: [seededSource],
          lowConfidence: false,
        };
      }),
    };
    aiChatProvider = {
      generateAnswer: vi.fn(async () => ({
        answer: "Refunds are available within seven days.",
        tokenUsage: {
          inputTokens: 12,
          outputTokens: 8,
          totalTokens: 20,
        },
      })),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RetrieveKnowledge)
      .useValue(retrieveKnowledge)
      .overrideProvider(AI_CHAT_PROVIDER)
      .useValue(aiChatProvider)
      .compile();

    app = moduleRef.createNestApplication();
    applyBootstrap(app);
    await app.init();

    db = app.get(DATABASE);
  });

  beforeEach(() => {
    sessionIds.length = 0;
    vi.clearAllMocks();
  });

  afterAll(async () => {
    if (sessionIds.length > 0) {
      await db?.delete(chatSessions).where(inArray(chatSessions.id, sessionIds));
    }
    await app?.close();
  });

  it("supports anonymous chat sessions", async () => {
    const session = await createAnonymousSession();

    const response = await request(app.getHttpServer())
      .post(`/api/v1/chat/sessions/${session.id}/messages`)
      .set("x-chat-session-token", session.sessionToken)
      .send({ message: "What is the refund policy?", includeSources: false })
      .expect(201);

    expect(response.body.data).toMatchObject({
      messageId: expect.any(String),
      answer: "Refunds are available within seven days.",
      handoffRequired: false,
      handoffReason: null,
    });
    expect(response.body.data.sources).toBeUndefined();
    expect(response.body.meta.traceId).toBeTypeOf("string");
  });

  it("returns sources when includeSources is true", async () => {
    const session = await createAnonymousSession();

    const response = await request(app.getHttpServer())
      .post(`/api/v1/chat/sessions/${session.id}/messages`)
      .set("x-chat-session-token", session.sessionToken)
      .send({ message: "What is the refund policy?", includeSources: true })
      .expect(201);

    expect(response.body.data.sources).toEqual([
      expect.objectContaining({
        sourceType: "document",
        sourceKey: seededSource.sourceKey,
        score: expect.any(Number),
        excerpt: expect.any(String),
      }),
    ]);
  });

  it("rejects anonymous chat messages when the session token is missing", async () => {
    const session = await createAnonymousSession();

    await request(app.getHttpServer())
      .post(`/api/v1/chat/sessions/${session.id}/messages`)
      .send({ message: "What is the refund policy?" })
      .expect(401);
  });

  it("rejects anonymous chat messages when the session token is wrong", async () => {
    const session = await createAnonymousSession();

    await request(app.getHttpServer())
      .post(`/api/v1/chat/sessions/${session.id}/messages`)
      .set("x-chat-session-token", "wrong-session-token")
      .send({ message: "What is the refund policy?" })
      .expect(403);
  });

  it("rejects anonymous chat messages when the session token is expired", async () => {
    const session = await createAnonymousSession();
    await db
      .update(chatSessions)
      .set({ anonymousTokenExpiresAt: new Date("2020-01-01T00:00:00.000Z") })
      .where(eq(chatSessions.id, session.id));

    await request(app.getHttpServer())
      .post(`/api/v1/chat/sessions/${session.id}/messages`)
      .set("x-chat-session-token", session.sessionToken)
      .send({ message: "What is the refund policy?" })
      .expect(401);
  });

  async function createAnonymousSession() {
    const response = await request(app.getHttpServer())
      .post("/api/v1/chat/sessions")
      .send({ anonymous: true })
      .expect(201);

    expect(response.body.data).toMatchObject({
      id: expect.any(String),
      userId: null,
      status: "active",
      sessionToken: expect.any(String),
    });

    sessionIds.push(response.body.data.id);

    return {
      id: response.body.data.id as string,
      sessionToken: response.body.data.sessionToken as string,
    };
  }
});
