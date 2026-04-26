import { Module } from "@nestjs/common";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { KNOWLEDGE_REPOSITORY } from "./domain/knowledge.repository";
import { DrizzleKnowledgeRepository } from "./infrastructure/knowledge.drizzle-repository";
import { DATABASE } from "../../shared/infrastructure/database/database.tokens";
import type { schema } from "../../shared/infrastructure/database/schema";

@Module({
  providers: [
    {
      provide: KNOWLEDGE_REPOSITORY,
      inject: [DATABASE],
      useFactory: (database: NodePgDatabase<typeof schema>) => {
        return new DrizzleKnowledgeRepository(database);
      },
    },
  ],
  exports: [KNOWLEDGE_REPOSITORY],
})
export class KnowledgeModule {}
