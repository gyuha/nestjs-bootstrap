import { Module } from "@nestjs/common";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { DATABASE } from "../../shared/infrastructure/database/database.tokens";
import type { schema } from "../../shared/infrastructure/database/schema";
import { SessionTokenService } from "./application/session-token.service";
import { CHAT_REPOSITORY } from "./domain/chat.repository";
import { DrizzleChatRepository } from "./infrastructure/chat.drizzle-repository";

@Module({
  providers: [
    SessionTokenService,
    {
      provide: CHAT_REPOSITORY,
      inject: [DATABASE],
      useFactory: (database: NodePgDatabase<typeof schema>) => {
        return new DrizzleChatRepository(database);
      },
    },
  ],
  exports: [CHAT_REPOSITORY, SessionTokenService],
})
export class ChatModule {}
