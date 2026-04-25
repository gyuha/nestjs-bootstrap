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
var __param =
  (this && this.__param) ||
  function (paramIndex, decorator) {
    return function (target, key) {
      decorator(target, key, paramIndex);
    };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.RAGService = exports.EMBEDDING_SERVICE = exports.VECTOR_STORE_SERVICE = void 0;
const common_1 = require("@nestjs/common");
const chunk_strategy_vo_1 = require("../../domain/value-objects/chunk-strategy.vo");
exports.VECTOR_STORE_SERVICE = "VECTOR_STORE_SERVICE";
exports.EMBEDDING_SERVICE = "EMBEDDING_SERVICE";
let RAGService = class RAGService {
  constructor(vectorStore, embeddingService) {
    this.vectorStore = vectorStore;
    this.embeddingService = embeddingService;
  }
  async search(query, topK = 5) {
    const queryEmbedding = await this.embeddingService.embed([query]);
    const results = await this.vectorStore.similaritySearch(queryEmbedding[0], topK);
    return results.map((r) => ({
      documentId: r.documentId,
      chunkId: r.chunkId,
      content: r.content,
      score: r.score,
    }));
  }
  async indexDocuments(source, options) {
    const chunkSize = options?.chunkSize ?? 1000;
    const chunkOverlap = options?.chunkOverlap ?? 200;
    const chunkStrategy = options?.chunkStrategy ?? chunk_strategy_vo_1.ChunkStrategy.PARAGRAPHS;
    console.log(
      `Indexing documents from ${source} with chunkSize=${chunkSize}, overlap=${chunkOverlap}, strategy=${chunkStrategy}`,
    );
  }
  async getSources(query) {
    return this.search(query, 3);
  }
};
exports.RAGService = RAGService;
exports.RAGService = RAGService = __decorate(
  [
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(exports.VECTOR_STORE_SERVICE)),
    __param(1, (0, common_1.Inject)(exports.EMBEDDING_SERVICE)),
    __metadata("design:paramtypes", [Object, Object]),
  ],
  RAGService,
);
//# sourceMappingURL=rag.service.js.map
