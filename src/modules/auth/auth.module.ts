import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { JwtService } from "@nestjs/jwt";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { authUseCases } from "./application/auth.use-cases";
import { RefreshTokenService } from "./application/refresh-token.service";
import { TokenService } from "./application/token.service";
import { AUTH_IDENTITY_REPOSITORY } from "./domain/auth-identity.repository";
import { PASSWORD_HASHER } from "./domain/password-hasher";
import { REFRESH_TOKEN_REPOSITORY } from "./domain/refresh-token.repository";
import { Argon2PasswordHasher } from "./infrastructure/argon2-password-hasher";
import { DrizzleAuthIdentityRepository } from "./infrastructure/auth-identity.drizzle-repository";
import { DrizzleRefreshTokenRepository } from "./infrastructure/refresh-token.drizzle-repository";
import { AuthController } from "./presentation/auth.controller";
import { UsersModule } from "../users/users.module";
import { DATABASE } from "../../shared/infrastructure/database/database.tokens";
import type { schema } from "../../shared/infrastructure/database/schema";

@Module({
  imports: [JwtModule, UsersModule],
  controllers: [AuthController],
  providers: [
    {
      provide: TokenService,
      inject: [JwtService, ConfigService],
      useFactory: (jwtService: JwtService, config: ConfigService) => {
        return new TokenService(jwtService, config);
      },
    },
    RefreshTokenService,
    {
      provide: PASSWORD_HASHER,
      useClass: Argon2PasswordHasher,
    },
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
    ...authUseCases,
  ],
  exports: [
    AUTH_IDENTITY_REPOSITORY,
    ...authUseCases,
    PASSWORD_HASHER,
    REFRESH_TOKEN_REPOSITORY,
    RefreshTokenService,
    TokenService,
  ],
})
export class AuthModule {}
