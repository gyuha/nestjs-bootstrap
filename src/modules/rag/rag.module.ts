import { Module, forwardRef } from '@nestjs/common';
import { RAGService } from './application/services/rag.service';
import { FileSystemConnector } from './application/connectors/file-system.connector';
import { DatabaseConnector } from './application/connectors/database.connector';
import { PgVectorStoreService, VECTOR_STORE_SERVICE } from './infrastructure/vector-store/pg-vector-store.service';
import { OpenAIEmbeddingService, EMBEDDING_SERVICE } from './infrastructure/embedding/openai-embedding.service';
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module';

@Module({
  imports: [forwardRef(() => AiGatewayModule)],
  providers: [
    RAGService,
    FileSystemConnector,
    DatabaseConnector,
    PgVectorStoreService,
    OpenAIEmbeddingService,
    {
      provide: VECTOR_STORE_SERVICE,
      useClass: PgVectorStoreService,
    },
    {
      provide: EMBEDDING_SERVICE,
      useClass: OpenAIEmbeddingService,
    },
  ],
  exports: [RAGService, VECTOR_STORE_SERVICE, EMBEDDING_SERVICE],
})
export class RagModule {}