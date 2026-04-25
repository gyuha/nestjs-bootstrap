"use strict";
var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
            ? (desc = Object.getOwnPropertyDescriptor(target, key))
            : desc,
      d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
var __metadata =
  (this && this.__metadata) ||
  function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
      return Reflect.metadata(k, v);
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.PgVectorStoreService = exports.VECTOR_STORE_SERVICE = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const rag_chunks_schema_1 = require("../../../../infrastructure/database/schema/rag-chunks.schema");
exports.VECTOR_STORE_SERVICE = "VECTOR_STORE_SERVICE";
let PgVectorStoreService = class PgVectorStoreService {
  constructor(db) {
    this.db = db;
  }
  async similaritySearch(queryEmbedding, topK) {
    const results = await this.db.db
      .select({
        id: rag_chunks_schema_1.ragChunks.id,
        content: rag_chunks_schema_1.ragChunks.content,
        documentId: rag_chunks_schema_1.ragChunks.documentId,
        source: rag_chunks_schema_1.ragChunks.source,
        sourcePath: rag_chunks_schema_1.ragChunks.sourcePath,
        distance: (0,
        drizzle_orm_1.sql)`${rag_chunks_schema_1.ragChunks.embedding} <=> ${queryEmbedding}`,
      })
      .from(rag_chunks_schema_1.ragChunks)
      .orderBy(
        (0, drizzle_orm_1.sql)`${rag_chunks_schema_1.ragChunks.embedding} <=> ${queryEmbedding}`,
      )
      .limit(topK);
    return results.map((row) => {
      const score = Math.max(0, 1 - row.distance / 2);
      return {
        chunkId: row.id,
        documentId: row.documentId,
        content: row.content,
        score,
      };
    });
  }
  async upsert(documents) {
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
    await this.db.db
      .insert(rag_chunks_schema_1.ragChunks)
      .values(chunks)
      .onConflictDoUpdate({
        target: rag_chunks_schema_1.ragChunks.id,
        set: {
          content: (0, drizzle_orm_1.sql)`excluded.content`,
          embedding: (0, drizzle_orm_1.sql)`excluded.embedding`,
        },
      });
  }
};
exports.PgVectorStoreService = PgVectorStoreService;
exports.PgVectorStoreService = PgVectorStoreService = __decorate(
  [(0, common_1.Injectable)(), __metadata("design:paramtypes", [Function])],
  PgVectorStoreService,
);
//# sourceMappingURL=pg-vector-store.service.js.map
