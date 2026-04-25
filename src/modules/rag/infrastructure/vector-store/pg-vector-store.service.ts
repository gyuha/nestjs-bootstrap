import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type { DrizzleService } from '../../../../infrastructure/database/drizzle.service';
import { ragChunks } from '../../../../infrastructure/database/schema/rag-chunks.schema';
import type { VectorStoreServiceInterface } from '../../../rag/application/services/rag.service';
import type { SearchResult } from '../../../rag/domain/services/irag.service';

export const VECTOR_STORE_SERVICE = 'VECTOR_STORE_SERVICE';

interface ChunkMetadata {
  documentId: string;
  source: string;
  sourcePath?: string;
  chunkIndex: number;
  totalChunks: number;
}

interface UpsertDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata: ChunkMetadata;
}

@Injectable()
export class PgVectorStoreService implements VectorStoreServiceInterface {
  constructor(private readonly db: DrizzleService) {}

  async similaritySearch(
    queryEmbedding: number[],
    topK: number,
  ): Promise<SearchResult[]> {
    // Use <=> operator for cosine distance
    // Distance 0 = identical, 2 = opposite
    // Convert distance to similarity score: score = 1 - (distance / 2)
    const results = await this.db.db
      .select({
        id: ragChunks.id,
        content: ragChunks.content,
        documentId: ragChunks.documentId,
        source: ragChunks.source,
        sourcePath: ragChunks.sourcePath,
        distance: sql<number>`${ragChunks.embedding} <=> ${queryEmbedding}`,
      })
      .from(ragChunks)
      .orderBy(sql`${ragChunks.embedding} <=> ${queryEmbedding}`)
      .limit(topK);

    return results.map((row) => {
      // cosine distance: 0 = identical, 2 = opposite
      // similarity score: 1 = identical, 0 = opposite
      const score = Math.max(0, 1 - row.distance / 2);
      return {
        chunkId: row.id,
        documentId: row.documentId,
        content: row.content,
        score,
      };
    });
  }

  async upsert(documents: UpsertDocument[]): Promise<void> {
    const chunks = documents.map((doc) => ({
      id: doc.id,
      documentId: doc.metadata.documentId,
      content: doc.content,
      embedding: doc.embedding,
      source: doc.metadata.source,
      sourcePath: doc.metadata.sourcePath,
      chunkIndex: doc.metadata.chunkIndex,
      totalChunks: doc.metadata.totalChunks,
    }));

    await this.db.db.insert(ragChunks).values(chunks).onConflictDoUpdate({
      target: ragChunks.id,
      set: {
        content: sql`excluded.content`,
        embedding: sql`excluded.embedding`,
      },
    });
  }
}
