import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { JwtAuthGuard } from "../auth/presentation/jwt-auth.guard";
import { RolesGuard } from "../auth/presentation/roles.guard";
import { userUseCases } from "./application/users.use-cases";
import { USER_REPOSITORY } from "./domain/user.repository";
import { DrizzleUserRepository } from "./infrastructure/users.drizzle-repository";
import { UsersAdminController } from "./presentation/users-admin.controller";
import { UsersMeController } from "./presentation/users-me.controller";
import { DATABASE } from "../../shared/infrastructure/database/database.tokens";
import type { schema } from "../../shared/infrastructure/database/schema";

@Module({
  imports: [JwtModule],
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
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [USER_REPOSITORY, ...userUseCases],
})
export class UsersModule {}
