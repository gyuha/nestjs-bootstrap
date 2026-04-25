import { pgTable, uuid, text, vector, timestamp, integer } from 'drizzle-orm/pg-core';
import { EMBEDDING_DIMENSIONS } from '../../../modules/rag/domain/constants';

export const ragChunks = pgTable('rag_chunks', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull(),
  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: EMBEDDING_DIMENSIONS }).notNull(),

  // Metadata
  source: text('source').notNull(),
  sourcePath: text('source_path'),
  chunkIndex: integer('chunk_index').notNull(),
  totalChunks: integer('total_chunks').notNull(),

  createdAt: timestamp('created_at').defaultNow(),
});

export type RAGChunk = typeof ragChunks.$inferSelect;
export type NewRAGChunk = typeof ragChunks.$inferInsert;
