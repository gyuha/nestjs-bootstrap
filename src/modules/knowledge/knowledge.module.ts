import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { DATABASE } from "../../shared/infrastructure/database/database.tokens";
import type { schema } from "../../shared/infrastructure/database/schema";
import { AiModule } from "../ai/ai.module";
import type { EmbeddingProvider } from "../ai/domain/embedding.provider";
import { EMBEDDING_PROVIDER } from "../ai/domain/embedding.provider";
import { JwtAuthGuard } from "../auth/presentation/jwt-auth.guard";
import { RolesGuard } from "../auth/presentation/roles.guard";
import { UsersModule } from "../users/users.module";
import { CreateKnowledgeDocument } from "./application/create-knowledge-document";
import { IndexKnowledgeDocument } from "./application/index-knowledge-document";
import { RetrieveKnowledge } from "./application/retrieve-knowledge";
import { KNOWLEDGE_REPOSITORY } from "./domain/knowledge.repository";
import type { KnowledgeSourceProvider } from "./domain/knowledge-source.provider";
import { KNOWLEDGE_SOURCE_PROVIDERS } from "./domain/knowledge-source.provider";
import { DrizzleKnowledgeRepository } from "./infrastructure/knowledge.drizzle-repository";
import { KnowledgeAdminController } from "./presentation/knowledge-admin.controller";

@Module({
  imports: [AiModule, JwtModule, UsersModule],
  controllers: [KnowledgeAdminController],
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
    CreateKnowledgeDocument,
    JwtAuthGuard,
    RolesGuard,
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
    CreateKnowledgeDocument,
    IndexKnowledgeDocument,
    RetrieveKnowledge,
  ],
})
export class KnowledgeModule {}
