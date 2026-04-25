import { Module } from "@nestjs/common";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { userUseCases } from "./application/users.use-cases";
import { USER_REPOSITORY } from "./domain/user.repository";
import { DrizzleUserRepository } from "./infrastructure/users.drizzle-repository";
import { UsersAdminController } from "./presentation/users-admin.controller";
import { UsersMeController } from "./presentation/users-me.controller";
import { DATABASE } from "../../shared/infrastructure/database/database.tokens";
import type { schema } from "../../shared/infrastructure/database/schema";

@Module({
  controllers: [UsersMeController, UsersAdminController],
  providers: [
    {
      provide: USER_REPOSITORY,
      inject: [DATABASE],
      useFactory: (database: NodePgDatabase<typeof schema>) => {
        return new DrizzleUserRepository(database);
      },
    },
    ...userUseCases,
  ],
  exports: [USER_REPOSITORY, ...userUseCases],
})
export class UsersModule {}
