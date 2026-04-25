import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type { DrizzleService } from '../../../../infrastructure/database/drizzle.service';
import { ragChunks } from '../../../../infrastructure/database/schema/rag-chunks.schema';
import type { VectorStoreServiceInterface } from '../../../rag/application/services/rag.service';
import type { SearchResult } from '../../../rag/domain/services/irag.service';

export interface VectorSearchResult {
  id: string;
  content: string;
  score: number;
  metadata: {
    documentId: string;
    source: string;
    sourcePath: string | null;
  };
}

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
    // Use <=> operator for cosine similarity (distance)
    // Smaller distance = higher similarity
    // Results are ordered by distance ascending (most similar first)
    const results = await this.db.db
      .select({
        id: ragChunks.id,
        content: ragChunks.content,
        documentId: ragChunks.documentId,
        source: ragChunks.source,
        sourcePath: ragChunks.sourcePath,
        embedding: ragChunks.embedding,
      })
      .from(ragChunks)
      .orderBy(sql`${ragChunks.embedding} <=> ${queryEmbedding}`)
      .limit(topK);

    return results.map((row) => {
      return {
        chunkId: row.id,
        documentId: row.documentId,
        content: row.content,
        score: 1, // Placeholder - actual score requires raw computation
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
