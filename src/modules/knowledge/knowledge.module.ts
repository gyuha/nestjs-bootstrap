import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { AiModule } from "../ai/ai.module";
import { EMBEDDING_PROVIDER } from "../ai/domain/embedding.provider";
import type { EmbeddingProvider } from "../ai/domain/embedding.provider";
import { IndexKnowledgeDocument } from "./application/index-knowledge-document";
import { RetrieveKnowledge } from "./application/retrieve-knowledge";
import { KNOWLEDGE_REPOSITORY } from "./domain/knowledge.repository";
import { KNOWLEDGE_SOURCE_PROVIDERS } from "./domain/knowledge-source.provider";
import type { KnowledgeSourceProvider } from "./domain/knowledge-source.provider";
import { DrizzleKnowledgeRepository } from "./infrastructure/knowledge.drizzle-repository";
import { DATABASE } from "../../shared/infrastructure/database/database.tokens";
import type { schema } from "../../shared/infrastructure/database/schema";

@Module({
  imports: [AiModule],
  providers: [
    {
      provide: KNOWLEDGE_REPOSITORY,
      inject: [DATABASE],
      useFactory: (database: NodePgDatabase<typeof schema>) => {
        return new DrizzleKnowledgeRepository(database);
      },
    },
    {
      provide: KNOWLEDGE_SOURCE_PROVIDERS,
      useValue: [] satisfies KnowledgeSourceProvider[],
    },
    IndexKnowledgeDocument,
    {
      provide: RetrieveKnowledge,
      inject: [KNOWLEDGE_REPOSITORY, EMBEDDING_PROVIDER, KNOWLEDGE_SOURCE_PROVIDERS, ConfigService],
      useFactory: (
        repository: DrizzleKnowledgeRepository,
        embeddingProvider: EmbeddingProvider,
        sourceProviders: KnowledgeSourceProvider[],
        config: ConfigService,
      ) => {
        return new RetrieveKnowledge(repository, embeddingProvider, sourceProviders, config);
      },
    },
  ],
  exports: [
    KNOWLEDGE_REPOSITORY,
    KNOWLEDGE_SOURCE_PROVIDERS,
    IndexKnowledgeDocument,
    RetrieveKnowledge,
  ],
})
export class KnowledgeModule {}
