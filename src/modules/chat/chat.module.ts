import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { AiModule } from "../ai/ai.module";
import { AI_CHAT_PROVIDER } from "../ai/domain/ai-chat.provider";
import type { AiChatProvider } from "../ai/domain/ai-chat.provider";
import { RetrieveKnowledge } from "../knowledge/application/retrieve-knowledge";
import { KnowledgeModule } from "../knowledge/knowledge.module";
import { DATABASE } from "../../shared/infrastructure/database/database.tokens";
import type { schema } from "../../shared/infrastructure/database/schema";
import {
  AskOnce,
  CreateChatSession,
  GetChatMessages,
  SendChatMessage,
} from "./application/chat.use-cases";
import { BasicPiiMasker, PII_MASKER } from "./application/pii-masker";
import { SessionTokenService } from "./application/session-token.service";
import { CHAT_REPOSITORY } from "./domain/chat.repository";
import type { ChatRepository } from "./domain/chat.repository";
import { DrizzleChatRepository } from "./infrastructure/chat.drizzle-repository";

@Module({
  imports: [AiModule, KnowledgeModule],
  providers: [
    SessionTokenService,
    {
      provide: PII_MASKER,
      useClass: BasicPiiMasker,
    },
    {
      provide: CHAT_REPOSITORY,
      inject: [DATABASE],
      useFactory: (database: NodePgDatabase<typeof schema>) => {
        return new DrizzleChatRepository(database);
      },
    },
    {
      provide: CreateChatSession,
      inject: [CHAT_REPOSITORY, SessionTokenService],
      useFactory: (repository: ChatRepository, sessionTokens: SessionTokenService) => {
        return new CreateChatSession(repository, sessionTokens);
      },
    },
    {
      provide: SendChatMessage,
      inject: [CHAT_REPOSITORY, RetrieveKnowledge, AI_CHAT_PROVIDER, PII_MASKER, ConfigService],
      useFactory: (
        repository: ChatRepository,
        retrieveKnowledge: RetrieveKnowledge,
        aiChatProvider: AiChatProvider,
        piiMasker: BasicPiiMasker,
        config: ConfigService,
      ) => {
        return new SendChatMessage(
          repository,
          retrieveKnowledge,
          aiChatProvider,
          piiMasker,
          config,
        );
      },
    },
    {
      provide: GetChatMessages,
      inject: [CHAT_REPOSITORY],
      useFactory: (repository: ChatRepository) => {
        return new GetChatMessages(repository);
      },
    },
    {
      provide: AskOnce,
      inject: [RetrieveKnowledge, AI_CHAT_PROVIDER, PII_MASKER],
      useFactory: (
        retrieveKnowledge: RetrieveKnowledge,
        aiChatProvider: AiChatProvider,
        piiMasker: BasicPiiMasker,
      ) => {
        return new AskOnce(retrieveKnowledge, aiChatProvider, piiMasker);
      },
    },
  ],
  exports: [
    CHAT_REPOSITORY,
    PII_MASKER,
    SessionTokenService,
    CreateChatSession,
    SendChatMessage,
    GetChatMessages,
    AskOnce,
  ],
})
export class ChatModule {}
