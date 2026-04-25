"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ragChunks = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const constants_1 = require("../../../modules/rag/domain/constants");
exports.ragChunks = (0, pg_core_1.pgTable)("rag_chunks", {
  id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
  documentId: (0, pg_core_1.uuid)("document_id").notNull(),
  content: (0, pg_core_1.text)("content").notNull(),
  embedding: (0, pg_core_1.vector)("embedding", {
    dimensions: constants_1.EMBEDDING_DIMENSIONS,
  }).notNull(),
  source: (0, pg_core_1.text)("source").notNull(),
  sourcePath: (0, pg_core_1.text)("source_path"),
  chunkIndex: (0, pg_core_1.integer)("chunk_index").notNull(),
  totalChunks: (0, pg_core_1.integer)("total_chunks").notNull(),
  createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
//# sourceMappingURL=rag-chunks.schema.js.map
