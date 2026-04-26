import { asc, eq, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PageResult } from "../../../shared/domain/pagination";
import {
  knowledgeChunks,
  knowledgeDocuments,
  knowledgeSyncJobs,
  type schema,
} from "../../../shared/infrastructure/database/schema";
import type {
  CreateKnowledgeChunkInput,
  CreateKnowledgeDocumentInput,
  CreateKnowledgeSyncJobInput,
  KnowledgeRepository,
} from "../domain/knowledge.repository";
import {
  KnowledgeDocumentNotFoundError,
  KnowledgeSyncJobNotFoundError,
} from "../domain/knowledge.repository";
import type {
  KnowledgeChunk,
  KnowledgeDocument,
  KnowledgeDocumentStatus,
  KnowledgeSyncJob,
} from "../domain/knowledge.types";

type Database = NodePgDatabase<typeof schema>;
type KnowledgeDocumentRow = typeof knowledgeDocuments.$inferSelect;
type KnowledgeChunkRow = typeof knowledgeChunks.$inferSelect;
type KnowledgeSyncJobRow = typeof knowledgeSyncJobs.$inferSelect;

export class DrizzleKnowledgeRepository implements KnowledgeRepository {
  constructor(private readonly db: Database) {}

  async createDocument(input: CreateKnowledgeDocumentInput): Promise<KnowledgeDocument> {
    const [row] = await this.db
      .insert(knowledgeDocuments)
      .values({
        title: input.title,
        sourceType: input.sourceType,
        sourceKey: input.sourceKey,
        metadata: input.metadata ?? {},
        createdBy: input.createdBy ?? null,
      })
      .returning();

    return this.toDocumentDomain(row);
  }

  async listDocuments(input: {
    page: number;
    limit: number;
  }): Promise<PageResult<KnowledgeDocument>> {
    const offset = (input.page - 1) * input.limit;

    const [items, totalRows] = await Promise.all([
      this.db
        .select()
        .from(knowledgeDocuments)
        .orderBy(asc(knowledgeDocuments.createdAt), asc(knowledgeDocuments.id))
        .limit(input.limit)
        .offset(offset),
      this.db.select({ total: sql<number>`count(*)::int` }).from(knowledgeDocuments),
    ]);

    return {
      items: items.map((row) => this.toDocumentDomain(row)),
      page: input.page,
      limit: input.limit,
      total: totalRows[0]?.total ?? 0,
    };
  }

  async markDocumentStatus(
    id: string,
    status: KnowledgeDocumentStatus,
  ): Promise<KnowledgeDocument> {
    const [row] = await this.db
      .update(knowledgeDocuments)
      .set({ status })
      .where(eq(knowledgeDocuments.id, id))
      .returning();

    if (!row) {
      throw new KnowledgeDocumentNotFoundError(id);
    }

    return this.toDocumentDomain(row);
  }

  async replaceChunks(
    documentId: string,
    chunks: CreateKnowledgeChunkInput[],
  ): Promise<KnowledgeChunk[]> {
    return this.db.transaction(async (tx) => {
      const [document] = await tx
        .select({ id: knowledgeDocuments.id })
        .from(knowledgeDocuments)
        .where(eq(knowledgeDocuments.id, documentId))
        .limit(1)
        .for("update");

      if (!document) {
        throw new KnowledgeDocumentNotFoundError(documentId);
      }

      await tx.delete(knowledgeChunks).where(eq(knowledgeChunks.documentId, documentId));

      if (chunks.length === 0) {
        return [];
      }

      const rows = await tx
        .insert(knowledgeChunks)
        .values(
          chunks.map((chunk) => ({
            documentId,
            chunkIndex: chunk.chunkIndex,
            content: chunk.content,
            metadata: chunk.metadata ?? {},
            embedding: chunk.embedding,
          })),
        )
        .returning();

      return rows
        .map((row) => this.toChunkDomain(row))
        .sort((left, right) => left.chunkIndex - right.chunkIndex);
    });
  }

  async createSyncJob(input: CreateKnowledgeSyncJobInput): Promise<KnowledgeSyncJob> {
    const [row] = await this.db
      .insert(knowledgeSyncJobs)
      .values({
        documentId: input.documentId ?? null,
        sourceType: input.sourceType,
        sourceKey: input.sourceKey,
        metadata: input.metadata ?? {},
      })
      .returning();

    return this.toSyncJobDomain(row);
  }

  async completeSyncJob(id: string): Promise<KnowledgeSyncJob> {
    const [row] = await this.db
      .update(knowledgeSyncJobs)
      .set({
        status: "succeeded",
        errorMessage: null,
        finishedAt: new Date(),
      })
      .where(eq(knowledgeSyncJobs.id, id))
      .returning();

    if (!row) {
      throw new KnowledgeSyncJobNotFoundError(id);
    }

    return this.toSyncJobDomain(row);
  }

  async failSyncJob(id: string, errorMessage: string): Promise<KnowledgeSyncJob> {
    const [row] = await this.db
      .update(knowledgeSyncJobs)
      .set({
        status: "failed",
        errorMessage,
        finishedAt: new Date(),
      })
      .where(eq(knowledgeSyncJobs.id, id))
      .returning();

    if (!row) {
      throw new KnowledgeSyncJobNotFoundError(id);
    }

    return this.toSyncJobDomain(row);
  }

  private toDocumentDomain(row: KnowledgeDocumentRow): KnowledgeDocument {
    return {
      id: row.id,
      title: row.title,
      sourceType: row.sourceType,
      sourceKey: row.sourceKey,
      status: row.status,
      metadata: row.metadata,
      createdBy: row.createdBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toChunkDomain(row: KnowledgeChunkRow): KnowledgeChunk {
    return {
      id: row.id,
      documentId: row.documentId,
      chunkIndex: row.chunkIndex,
      content: row.content,
      metadata: row.metadata,
      embedding: row.embedding as number[],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toSyncJobDomain(row: KnowledgeSyncJobRow): KnowledgeSyncJob {
    return {
      id: row.id,
      documentId: row.documentId,
      sourceType: row.sourceType,
      sourceKey: row.sourceKey,
      status: row.status,
      errorMessage: row.errorMessage,
      metadata: row.metadata,
      startedAt: row.startedAt,
      finishedAt: row.finishedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
