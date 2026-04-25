import { Module } from "@nestjs/common";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { USER_REPOSITORY } from "./domain/user.repository";
import { DrizzleUserRepository } from "./infrastructure/users.drizzle-repository";
import { DATABASE } from "../../shared/infrastructure/database/database.tokens";
import type { schema } from "../../shared/infrastructure/database/schema";

@Module({
  providers: [
    {
      provide: USER_REPOSITORY,
      inject: [DATABASE],
      useFactory: (database: NodePgDatabase<typeof schema>) => {
        return new DrizzleUserRepository(database);
      },
    },
  ],
  exports: [USER_REPOSITORY],
})
export class UsersModule {}
