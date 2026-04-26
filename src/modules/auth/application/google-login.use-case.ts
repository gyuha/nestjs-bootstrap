import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { parseDurationMs } from "../../../shared/utils/duration";
import { toUserResponse } from "../../users/application/user.response";
import { normalizeEmail, type User } from "../../users/domain/user.entity";
import { USER_REPOSITORY, type UserRepository, DuplicateUserEmailError } from "../../users/domain/user.repository";
import {
  AUTH_IDENTITY_REPOSITORY,
  type AuthIdentityRepository,
  DuplicateAuthIdentityError,
} from "../domain/auth-identity.repository";
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from "../domain/refresh-token.repository";
import { InactiveUserAuthError, InvalidAuthCredentialsError } from "./auth.errors";
import type { AuthSessionResponse } from "./auth.response";
import { RefreshTokenService } from "./refresh-token.service";
import { TokenService } from "./token.service";

const googleProvider = "google";

export type GoogleLoginInput = {
  providerUserId: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  avatarUrl?: string | null;
};

@Injectable()
export class GoogleLogin {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepository,
    @Inject(AUTH_IDENTITY_REPOSITORY)
    private readonly identities: AuthIdentityRepository,
    @Inject(RefreshTokenService)
    private readonly refreshTokenService: RefreshTokenService,
    @Inject(TokenService)
    private readonly tokenService: TokenService,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokens: RefreshTokenRepository,
    @Inject(ConfigService)
    private readonly config: ConfigService,
  ) {}

  async execute(input: GoogleLoginInput): Promise<AuthSessionResponse> {
    const profile = {
      ...input,
      email: normalizeEmail(input.email),
    };

    if (!profile.emailVerified) {
      throw new InvalidAuthCredentialsError();
    }

    const identity = await this.identities.findByProvider(googleProvider, profile.providerUserId);

    if (identity) {
      const user = await this.users.findById(identity.userId);

      if (!user || user.status !== "active") {
        throw new InactiveUserAuthError();
      }

      return this.createSession(user.id, user.role, toUserResponse(user));
    }

    const existingUser = await this.users.findByEmail(profile.email);

    let user: User;

    if (existingUser) {
      user = existingUser;
    } else {
      try {
        user = await this.users.create({
          email: profile.email,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
        });
      } catch (error) {
        if (error instanceof DuplicateUserEmailError) {
          const recovered = await this.users.findByEmail(profile.email);
          if (!recovered) throw new InvalidAuthCredentialsError();
          user = recovered;
        } else {
          throw error;
        }
      }
    }

    if (user.status !== "active") {
      throw new InactiveUserAuthError();
    }

    try {
      await this.identities.create({
        userId: user.id,
        provider: googleProvider,
        providerUserId: profile.providerUserId,
        passwordHash: null,
        emailVerified: profile.emailVerified,
      });
    } catch (error) {
      if (error instanceof DuplicateAuthIdentityError) {
        throw new InvalidAuthCredentialsError();
      }

      throw error;
    }

    return this.createSession(user.id, user.role, toUserResponse(user));
  }

  private async createSession(
    userId: string,
    role: "USER" | "ADMIN",
    user: AuthSessionResponse["user"],
  ): Promise<AuthSessionResponse> {
    const refreshTokenPair = this.refreshTokenService.generateRefreshTokenPair();
    const refreshToken = await this.refreshTokens.create({
      userId,
      tokenHash: refreshTokenPair.tokenHash,
      expiresAt: getRefreshTokenExpiration(this.config),
    });
    const accessToken = await this.tokenService.createAccessToken({
      userId,
      role,
      sessionId: refreshToken.id,
    });

    return {
      accessToken,
      refreshToken: refreshTokenPair.plainToken,
      user,
    };
  }
}

function getRefreshTokenExpiration(config: ConfigService): Date {
  const expiresIn = config.getOrThrow<string>("auth.refreshTokenExpiresIn");
  return new Date(Date.now() + parseDurationMs(expiresIn));
}
