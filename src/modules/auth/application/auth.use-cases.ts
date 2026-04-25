import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { toUserResponse, type UserResponse } from "../../users/application/user.response";
import { USER_REPOSITORY, type UserRepository } from "../../users/domain/user.repository";
import { TokenService } from "./token.service";
import { RefreshTokenService } from "./refresh-token.service";
import {
  AUTH_IDENTITY_REPOSITORY,
  DuplicateAuthIdentityError,
  type AuthIdentityRepository,
} from "../domain/auth-identity.repository";
import { PASSWORD_HASHER, type PasswordHasher } from "../domain/password-hasher";
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from "../domain/refresh-token.repository";
import {
  InactiveUserAuthError,
  InvalidAuthCredentialsError,
  InvalidRefreshTokenError,
} from "./auth.errors";
import type { AuthSessionResponse } from "./auth.response";

const passwordProvider = "password";

export type PasswordAuthInput = {
  email: string;
  password: string;
};

export type RegisterWithPasswordInput = PasswordAuthInput & {
  displayName: string;
};

export type RefreshSessionInput = {
  refreshToken: string;
  userAgent?: string | null;
  ipAddress?: string | null;
};

export type LogoutSessionInput = {
  refreshToken: string;
};

@Injectable()
export class RegisterWithPassword {
  @Inject(USER_REPOSITORY)
  private readonly users!: UserRepository;

  @Inject(AUTH_IDENTITY_REPOSITORY)
  private readonly identities!: AuthIdentityRepository;

  @Inject(PASSWORD_HASHER)
  private readonly passwordHasher!: PasswordHasher;

  @Inject(REFRESH_TOKEN_REPOSITORY)
  private readonly refreshTokens!: RefreshTokenRepository;

  @Inject(RefreshTokenService)
  private readonly refreshTokenService!: RefreshTokenService;

  @Inject(TokenService)
  private readonly tokenService!: TokenService;

  @Inject(ConfigService)
  private readonly config!: ConfigService;

  async execute(input: RegisterWithPasswordInput): Promise<AuthSessionResponse> {
    const email = normalizeEmail(input.email);
    const existingUser = await this.users.findByEmail(email);

    if (existingUser) {
      throw new InvalidAuthCredentialsError();
    }

    const user = await this.users.create({
      email,
      displayName: input.displayName,
    });
    const passwordHash = await this.passwordHasher.hash(input.password);

    try {
      await this.identities.create({
        userId: user.id,
        provider: passwordProvider,
        providerUserId: email,
        passwordHash,
        emailVerified: false,
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
    user: UserResponse,
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

@Injectable()
export class LoginWithPassword {
  @Inject(USER_REPOSITORY)
  private readonly users!: UserRepository;

  @Inject(AUTH_IDENTITY_REPOSITORY)
  private readonly identities!: AuthIdentityRepository;

  @Inject(PASSWORD_HASHER)
  private readonly passwordHasher!: PasswordHasher;

  @Inject(REFRESH_TOKEN_REPOSITORY)
  private readonly refreshTokens!: RefreshTokenRepository;

  @Inject(RefreshTokenService)
  private readonly refreshTokenService!: RefreshTokenService;

  @Inject(TokenService)
  private readonly tokenService!: TokenService;

  @Inject(ConfigService)
  private readonly config!: ConfigService;

  async execute(input: PasswordAuthInput): Promise<AuthSessionResponse> {
    const email = normalizeEmail(input.email);
    const identity = await this.identities.findByProvider(passwordProvider, email);

    if (!identity?.passwordHash) {
      throw new InvalidAuthCredentialsError();
    }

    const validPassword = await this.passwordHasher.verify(identity.passwordHash, input.password);

    if (!validPassword) {
      throw new InvalidAuthCredentialsError();
    }

    const user = await this.users.findById(identity.userId);

    if (!user || user.status !== "active") {
      throw new InactiveUserAuthError();
    }

    const refreshTokenPair = this.refreshTokenService.generateRefreshTokenPair();
    const refreshToken = await this.refreshTokens.create({
      userId: user.id,
      tokenHash: refreshTokenPair.tokenHash,
      expiresAt: getRefreshTokenExpiration(this.config),
    });
    const accessToken = await this.tokenService.createAccessToken({
      userId: user.id,
      role: user.role,
      sessionId: refreshToken.id,
    });

    return {
      accessToken,
      refreshToken: refreshTokenPair.plainToken,
      user: toUserResponse(user),
    };
  }
}

@Injectable()
export class RefreshSession {
  @Inject(USER_REPOSITORY)
  private readonly users!: UserRepository;

  @Inject(REFRESH_TOKEN_REPOSITORY)
  private readonly refreshTokens!: RefreshTokenRepository;

  @Inject(RefreshTokenService)
  private readonly refreshTokenService!: RefreshTokenService;

  @Inject(TokenService)
  private readonly tokenService!: TokenService;

  @Inject(ConfigService)
  private readonly config!: ConfigService;

  async execute(input: RefreshSessionInput): Promise<AuthSessionResponse> {
    const tokenHash = this.refreshTokenService.hashRefreshToken(input.refreshToken);
    const currentToken = await this.refreshTokens.findValidByHash(tokenHash);

    if (!currentToken) {
      throw new InvalidRefreshTokenError();
    }

    const user = await this.users.findById(currentToken.userId);

    if (!user || user.status !== "active") {
      throw new InvalidRefreshTokenError();
    }

    const refreshTokenPair = this.refreshTokenService.generateRefreshTokenPair();
    const replacementToken = await this.refreshTokens.create({
      userId: user.id,
      tokenHash: refreshTokenPair.tokenHash,
      expiresAt: getRefreshTokenExpiration(this.config),
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
    });

    await this.refreshTokens.revoke(currentToken.id, replacementToken.id);

    const accessToken = await this.tokenService.createAccessToken({
      userId: user.id,
      role: user.role,
      sessionId: replacementToken.id,
    });

    return {
      accessToken,
      refreshToken: refreshTokenPair.plainToken,
      user: toUserResponse(user),
    };
  }
}

@Injectable()
export class LogoutSession {
  @Inject(REFRESH_TOKEN_REPOSITORY)
  private readonly refreshTokens!: RefreshTokenRepository;

  @Inject(RefreshTokenService)
  private readonly refreshTokenService!: RefreshTokenService;

  async execute(input: LogoutSessionInput): Promise<void> {
    const tokenHash = this.refreshTokenService.hashRefreshToken(input.refreshToken);
    const refreshToken = await this.refreshTokens.findValidByHash(tokenHash);

    if (refreshToken) {
      await this.refreshTokens.revoke(refreshToken.id, null);
    }
  }
}

@Injectable()
export class GetAuthenticatedUser {
  @Inject(USER_REPOSITORY)
  private readonly users!: UserRepository;

  async execute(userId: string): Promise<UserResponse> {
    const user = await this.users.findById(userId);

    if (!user || user.status !== "active") {
      throw new InvalidAuthCredentialsError("Authentication required");
    }

    return toUserResponse(user);
  }
}

export const authUseCases = [
  RegisterWithPassword,
  LoginWithPassword,
  RefreshSession,
  LogoutSession,
  GetAuthenticatedUser,
];

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
