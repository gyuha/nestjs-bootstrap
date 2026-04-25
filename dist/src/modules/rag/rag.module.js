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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RagModule = void 0;
const common_1 = require("@nestjs/common");
const rag_service_1 = require("./application/services/rag.service");
const file_system_connector_1 = require("./application/connectors/file-system.connector");
const database_connector_1 = require("./application/connectors/database.connector");
const pg_vector_store_service_1 = require("./infrastructure/vector-store/pg-vector-store.service");
const openai_embedding_service_1 = require("./infrastructure/embedding/openai-embedding.service");
const ai_gateway_module_1 = require("../ai-gateway/ai-gateway.module");
let RagModule = class RagModule {};
exports.RagModule = RagModule;
exports.RagModule = RagModule = __decorate(
  [
    (0, common_1.Module)({
      imports: [(0, common_1.forwardRef)(() => ai_gateway_module_1.AiGatewayModule)],
      providers: [
        rag_service_1.RAGService,
        file_system_connector_1.FileSystemConnector,
        database_connector_1.DatabaseConnector,
        pg_vector_store_service_1.PgVectorStoreService,
        openai_embedding_service_1.OpenAIEmbeddingService,
        {
          provide: pg_vector_store_service_1.VECTOR_STORE_SERVICE,
          useClass: pg_vector_store_service_1.PgVectorStoreService,
        },
        {
          provide: openai_embedding_service_1.EMBEDDING_SERVICE,
          useClass: openai_embedding_service_1.OpenAIEmbeddingService,
        },
      ],
      exports: [
        rag_service_1.RAGService,
        pg_vector_store_service_1.VECTOR_STORE_SERVICE,
        openai_embedding_service_1.EMBEDDING_SERVICE,
      ],
    }),
  ],
  RagModule,
);
//# sourceMappingURL=rag.module.js.map
