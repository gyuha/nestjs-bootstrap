import { randomUUID } from "node:crypto";
import type { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import { eq, like } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { AppModule } from "../../src/app.module";
import { applyBootstrap } from "../../src/bootstrap/apply-bootstrap";
import type { EmbeddingProvider } from "../../src/modules/ai/domain/embedding.provider";
import { EMBEDDING_PROVIDER } from "../../src/modules/ai/domain/embedding.provider";
import { maxKnowledgeDocumentContentLength } from "../../src/modules/knowledge/presentation/knowledge.dto";
import { DATABASE } from "../../src/shared/infrastructure/database/database.tokens";
import {
  knowledgeChunks,
  knowledgeDocuments,
  type schema,
  users,
} from "../../src/shared/infrastructure/database/schema";
import { migrateTestDatabase } from "../setup/test-database";
import "../setup/test-env";

const testPrefix = `knowledge-admin-e2e-${randomUUID()}`;
const embedding = Array.from({ length: 1536 }, () => 0.01);

describe("Knowledge Admin API", () => {
  let app: INestApplication;
  let db: NodePgDatabase<typeof schema>;
  let embeddingProvider: EmbeddingProvider;

  beforeAll(async () => {
    migrateTestDatabase();

    embeddingProvider = {
      embed: vi.fn(async () => ({
        embedding,
        tokenUsage: {
          promptTokens: 1,
          totalTokens: 1,
        },
      })),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EMBEDDING_PROVIDER)
      .useValue(embeddingProvider)
      .compile();

    app = moduleRef.createNestApplication();
    applyBootstrap(app);
    await app.init();

    db = app.get(DATABASE);
  });

  beforeEach(async () => {
    await db.delete(knowledgeDocuments).where(like(knowledgeDocuments.sourceKey, `${testPrefix}%`));
    await db.delete(users).where(like(users.email, `${testPrefix}%`));
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await db
      ?.delete(knowledgeDocuments)
      .where(like(knowledgeDocuments.sourceKey, `${testPrefix}%`));
    await db?.delete(users).where(like(users.email, `${testPrefix}%`));
    await app?.close();
  });

  it("allows admins to create a text knowledge document", async () => {
    const admin = await createUser(db, {
      email: `${testPrefix}-admin@example.com`,
      displayName: "Knowledge Admin",
      role: "ADMIN",
    });
    const token = await createAccessToken({ userId: admin.id, role: "ADMIN" });

    const response = await request(app.getHttpServer())
      .post("/api/v1/knowledge/documents")
      .set("authorization", `Bearer ${token}`)
      .send({
        title: "Refund Policy",
        sourceKey: `${testPrefix}-refund-policy`,
        content: "Refunds are available within seven days.",
        metadata: { category: "policy" },
      })
      .expect(201);

    expect(response.body.data).toMatchObject({
      title: "Refund Policy",
      sourceType: "document",
      sourceKey: `${testPrefix}-refund-policy`,
      status: "active",
      metadata: { category: "policy" },
      createdBy: admin.id,
    });
    expect(response.body.meta.traceId).toBeTypeOf("string");
    expect(embeddingProvider.embed).toHaveBeenCalledWith(
      "Refunds are available within seven days.",
    );

    const chunks = await db
      .select()
      .from(knowledgeChunks)
      .where(eq(knowledgeChunks.documentId, response.body.data.id));

    expect(chunks).toHaveLength(1);
  });

  it("forbids non-admin users from creating knowledge documents", async () => {
    const user = await createUser(db, {
      email: `${testPrefix}-user@example.com`,
      displayName: "Knowledge User",
      role: "USER",
    });
    const token = await createAccessToken({ userId: user.id, role: "USER" });

    await request(app.getHttpServer())
      .post("/api/v1/knowledge/documents")
      .set("authorization", `Bearer ${token}`)
      .send({
        title: "Policy",
        sourceKey: `${testPrefix}-policy`,
        content: "Policy text",
      })
      .expect(403);
  });

  it("returns 409 when a document source already exists", async () => {
    const admin = await createUser(db, {
      email: `${testPrefix}-duplicate-admin@example.com`,
      displayName: "Duplicate Admin",
      role: "ADMIN",
    });
    const token = await createAccessToken({ userId: admin.id, role: "ADMIN" });
    const sourceKey = `${testPrefix}-duplicate-source`;

    await request(app.getHttpServer())
      .post("/api/v1/knowledge/documents")
      .set("authorization", `Bearer ${token}`)
      .send({
        title: "Duplicate Policy",
        sourceKey,
        content: "Initial policy text.",
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post("/api/v1/knowledge/documents")
      .set("authorization", `Bearer ${token}`)
      .send({
        title: "Duplicate Policy Updated",
        sourceKey,
        content: "Updated policy text.",
      })
      .expect(409);

    expect(response.body.message).toContain("Knowledge document source already exists");
  });

  it("rejects content that exceeds the configured maximum length", async () => {
    const admin = await createUser(db, {
      email: `${testPrefix}-validation-admin@example.com`,
      displayName: "Validation Admin",
      role: "ADMIN",
    });
    const token = await createAccessToken({ userId: admin.id, role: "ADMIN" });

    await request(app.getHttpServer())
      .post("/api/v1/knowledge/documents")
      .set("authorization", `Bearer ${token}`)
      .send({
        title: "Large Policy",
        sourceKey: `${testPrefix}-large-policy`,
        content: "a".repeat(maxKnowledgeDocumentContentLength + 1),
      })
      .expect(400);
  });
});

async function createAccessToken(input: { userId: string; role: "USER" | "ADMIN" }) {
  return new JwtService().signAsync(
    {
      sub: input.userId,
      role: input.role,
      sessionId: randomUUID(),
    },
    {
      secret: process.env.JWT_ACCESS_TOKEN_SECRET,
    },
  );
}

async function createUser(
  db: NodePgDatabase<typeof schema>,
  input: {
    email: string;
    displayName: string;
    role: "USER" | "ADMIN";
  },
) {
  const [user] = await db
    .insert(users)
    .values({
      email: input.email,
      displayName: input.displayName,
      role: input.role,
    })
    .returning();

  return user;
}
