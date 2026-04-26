import { randomUUID } from "node:crypto";
import { like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  KnowledgeDocumentNotFoundError,
  KnowledgeSyncJobNotFoundError,
} from "../../src/modules/knowledge/domain/knowledge.repository";
import { DrizzleKnowledgeRepository } from "../../src/modules/knowledge/infrastructure/knowledge.drizzle-repository";
import {
  knowledgeChunks,
  knowledgeDocuments,
  knowledgeSyncJobs,
  schema,
} from "../../src/shared/infrastructure/database/schema";
import { migrateTestDatabase } from "../setup/test-database";
import "../setup/test-env";

const databaseUrl = process.env.DATABASE_URL;
const sourceKeyPrefix = `knowledge-repository-${randomUUID()}`;
const embedding = Array.from({ length: 1536 }, (_, index) => index / 1536);

describe("DrizzleKnowledgeRepository", () => {
  let pool: Pool;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let repository: DrizzleKnowledgeRepository;

  beforeAll(() => {
    if (!databaseUrl?.includes("nestjs_bootstrap_test")) {
      throw new Error("Refusing to run knowledge repository tests against a non-test database");
    }

    migrateTestDatabase();
    pool = new Pool({ connectionString: databaseUrl });
    db = drizzle(pool, { schema });
    repository = new DrizzleKnowledgeRepository(db);
  });

  beforeEach(async () => {
    await db
      .delete(knowledgeSyncJobs)
      .where(like(knowledgeSyncJobs.sourceKey, `${sourceKeyPrefix}%`));
    await db
      .delete(knowledgeDocuments)
      .where(like(knowledgeDocuments.sourceKey, `${sourceKeyPrefix}%`));
  });

  afterAll(async () => {
    if (db) {
      await db
        .delete(knowledgeSyncJobs)
        .where(like(knowledgeSyncJobs.sourceKey, `${sourceKeyPrefix}%`));
      await db
        .delete(knowledgeDocuments)
        .where(like(knowledgeDocuments.sourceKey, `${sourceKeyPrefix}%`));
    }

    await pool?.end();
  });

  it("creates and lists documents with stable pagination", async () => {
    const first = await repository.createDocument({
      title: "Refund Policy",
      sourceType: "document",
      sourceKey: `${sourceKeyPrefix}-first`,
      metadata: { section: "billing" },
    });
    const second = await repository.createDocument({
      title: "Internal SLA",
      sourceType: "internal_db",
      sourceKey: `${sourceKeyPrefix}-second`,
      metadata: { table: "support_articles" },
      createdBy: null,
    });

    expect(first).toMatchObject({
      id: expect.any(String),
      title: "Refund Policy",
      sourceType: "document",
      sourceKey: `${sourceKeyPrefix}-first`,
      status: "indexing",
      metadata: { section: "billing" },
      createdBy: null,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });

    const result = await repository.listDocuments({ page: 1, limit: 10 });

    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.total).toBeGreaterThanOrEqual(2);
    expect(result.items.map((document) => document.id)).toEqual(
      expect.arrayContaining([first.id, second.id]),
    );
  });

  it("marks document status and throws a domain error for missing documents", async () => {
    const document = await repository.createDocument({
      title: "Status Policy",
      sourceType: "document",
      sourceKey: `${sourceKeyPrefix}-status`,
    });

    const updated = await repository.markDocumentStatus(document.id, "active");

    expect(updated.status).toBe("active");
    await expect(repository.markDocumentStatus(randomUUID(), "failed")).rejects.toBeInstanceOf(
      KnowledgeDocumentNotFoundError,
    );
  });

  it("replaces chunks for a document in chunk index order", async () => {
    const document = await repository.createDocument({
      title: "Chunk Policy",
      sourceType: "document",
      sourceKey: `${sourceKeyPrefix}-chunks`,
    });

    await repository.replaceChunks(document.id, [
      {
        chunkIndex: 0,
        content: "old content",
        metadata: { version: 1 },
        embedding,
      },
    ]);

    const replacement = await repository.replaceChunks(document.id, [
      {
        chunkIndex: 1,
        content: "second replacement",
        metadata: { ordinal: 2 },
        embedding,
      },
      {
        chunkIndex: 0,
        content: "first replacement",
        metadata: { ordinal: 1 },
        embedding,
      },
    ]);

    expect(replacement.map((chunk) => chunk.content)).toEqual([
      "first replacement",
      "second replacement",
    ]);

    const persisted = await db
      .select()
      .from(knowledgeChunks)
      .where(like(knowledgeChunks.content, "%replacement"));
    expect(persisted.filter((chunk) => chunk.documentId === document.id)).toHaveLength(2);

    await expect(repository.replaceChunks(randomUUID(), [])).rejects.toBeInstanceOf(
      KnowledgeDocumentNotFoundError,
    );
  });

  it("completes and fails sync jobs", async () => {
    const document = await repository.createDocument({
      title: "Sync Policy",
      sourceType: "document",
      sourceKey: `${sourceKeyPrefix}-sync-document`,
    });
    const completedJob = await repository.createSyncJob({
      documentId: document.id,
      sourceType: "document",
      sourceKey: `${sourceKeyPrefix}-sync-complete`,
      metadata: { attempt: 1 },
    });
    const failedJob = await repository.createSyncJob({
      sourceType: "internal_db",
      sourceKey: `${sourceKeyPrefix}-sync-fail`,
    });

    const completed = await repository.completeSyncJob(completedJob.id);
    const failed = await repository.failSyncJob(failedJob.id, "embedding failed");

    expect(completed).toMatchObject({
      id: completedJob.id,
      documentId: document.id,
      status: "succeeded",
      errorMessage: null,
      finishedAt: expect.any(Date),
    });
    expect(failed).toMatchObject({
      id: failedJob.id,
      documentId: null,
      status: "failed",
      errorMessage: "embedding failed",
      finishedAt: expect.any(Date),
    });
    await expect(repository.completeSyncJob(randomUUID())).rejects.toBeInstanceOf(
      KnowledgeSyncJobNotFoundError,
    );
    await expect(repository.failSyncJob(randomUUID(), "missing")).rejects.toBeInstanceOf(
      KnowledgeSyncJobNotFoundError,
    );
  });
});
