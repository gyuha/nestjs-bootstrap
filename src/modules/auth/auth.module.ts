import { Module } from "@nestjs/common";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { AUTH_IDENTITY_REPOSITORY } from "./domain/auth-identity.repository";
import { REFRESH_TOKEN_REPOSITORY } from "./domain/refresh-token.repository";
import { DrizzleAuthIdentityRepository } from "./infrastructure/auth-identity.drizzle-repository";
import { DrizzleRefreshTokenRepository } from "./infrastructure/refresh-token.drizzle-repository";
import { DATABASE } from "../../shared/infrastructure/database/database.tokens";
import type { schema } from "../../shared/infrastructure/database/schema";

@Module({
  providers: [
    {
      provide: AUTH_IDENTITY_REPOSITORY,
      inject: [DATABASE],
      useFactory: (database: NodePgDatabase<typeof schema>) => {
        return new DrizzleAuthIdentityRepository(database);
      },
    },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      inject: [DATABASE],
      useFactory: (database: NodePgDatabase<typeof schema>) => {
        return new DrizzleRefreshTokenRepository(database);
      },
    },
  ],
  exports: [AUTH_IDENTITY_REPOSITORY, REFRESH_TOKEN_REPOSITORY],
})
export class AuthModule {}
