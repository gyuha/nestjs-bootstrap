import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { toUserResponse } from "../../users/application/user.response";
import { USER_REPOSITORY, type UserRepository } from "../../users/domain/user.repository";
import {
  AUTH_IDENTITY_REPOSITORY,
  DuplicateAuthIdentityError,
  type AuthIdentityRepository,
} from "../domain/auth-identity.repository";
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from "../domain/refresh-token.repository";
import { InvalidAuthCredentialsError, InactiveUserAuthError } from "./auth.errors";
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
    const identity = await this.identities.findByProvider(googleProvider, profile.providerUserId);

    if (identity) {
      const user = await this.users.findById(identity.userId);

      if (!user || user.status !== "active") {
        throw new InactiveUserAuthError();
      }

      return this.createSession(user.id, user.role, toUserResponse(user));
    }

    const existingUser = await this.users.findByEmail(profile.email);

    if (existingUser && !profile.emailVerified) {
      throw new InvalidAuthCredentialsError();
    }

    const user =
      existingUser ??
      (await this.users.create({
        email: profile.email,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
      }));

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

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getRefreshTokenExpiration(config: ConfigService): Date {
  const expiresIn = config.getOrThrow<string>("auth.refreshTokenExpiresIn");
  const now = Date.now();

  return new Date(now + parseDurationMs(expiresIn));
}

function parseDurationMs(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim());

  if (!match) {
    throw new Error(`Unsupported refresh token expiration: ${value}`);
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };

  return amount * multipliers[unit as keyof typeof multipliers];
}
