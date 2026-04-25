import { Injectable, Inject } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { createHash, } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { AuthResult } from '../domain/entities/auth.entity';
import type { TokenPair } from '../domain/value-objects/token.value-object';
import { OAuthProvider } from '../domain/value-objects/oauth-provider.value-object';
import type { UserRepository } from '../../users/domain/repository/user.repository.interface';
import type { JwtTokenService } from '../infrastructure/services/jwt-token.service';
import type { AuthTokenRepositoryInterface } from '../domain/repositories/auth-token.repository.interface';
import type { OAuthGoogleService } from '../infrastructure/services/oauth-google.service';
import type { OAuthKakaoService } from '../infrastructure/services/oauth-kakao.service';
import type { DrizzleService } from '../../../infrastructure/database/drizzle.service';
import { users } from '../../../infrastructure/database/schema/users.schema';
import { oauthAccounts } from '../../../infrastructure/database/schema/oauth-accounts.schema';
import { AuthException } from '../presentation/exceptions/auth.exception';
import { Role, UserStatus } from '../../users/domain/value-objects/role.value-object';
import type { EnvService } from '../../../config/env.service';
import type { EmailServiceInterface } from '../../../shared/infrastructure/email/email-service.interface';

const AUTH_TOKEN_REPOSITORY = 'AUTH_TOKEN_REPOSITORY';
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const MAX_LOGIN_ATTEMPTS = 10;
const _VERIFICATION_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const _RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
const _MAGIC_LINK_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

@Injectable()
export class AuthApplicationService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly jwtTokenService: JwtTokenService,
    @Inject(AUTH_TOKEN_REPOSITORY) private readonly _tokenRepo: AuthTokenRepositoryInterface,
    private readonly oauthGoogle: OAuthGoogleService,
    private readonly oauthKakao: OAuthKakaoService,
    private readonly db: DrizzleService,
    private readonly env: EnvService,
    private readonly emailService: EmailServiceInterface,
  ) {}

  async loginWithPassword(email: string, password: string): Promise<AuthResult> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw AuthException.invalidCredentials();

    // Check account lockout
    if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
      throw AuthException.accountLocked();
    }

    const isValid = await bcrypt.compare(password, user.passwordHash!);
    if (!isValid) {
      // Increment failed login attempts
      await this.incrementFailedLoginAttempts(user.id);
      // Reload user to get updated count
      const updatedUser = await this.userRepo.findByEmail(email);
      // Check if should lock
      if (updatedUser && updatedUser.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS - 1) {
        await this.lockAccount(user.id);
        throw AuthException.accountLocked();
      }
      throw AuthException.invalidCredentials();
    }

    // Reset failed attempts on success
    await this.resetFailedLoginAttempts(user.id);

    return this.generateAuthResult(user.id, user.email, user.name, user.role);
  }

  async loginWithOAuth(provider: OAuthProvider, code: string): Promise<AuthResult> {
    const oauthService = provider === OAuthProvider.GOOGLE ? this.oauthGoogle : this.oauthKakao;
    const oauthUser = await oauthService.getUserInfo(provider, code);

    let user = await this.userRepo.findByOAuthProvider(provider, oauthUser.providerUserId);

    if (!user) {
      // Create new user
      const newUser = {
        id: crypto.randomUUID(),
        email: oauthUser.email,
        passwordHash: null,
        name: oauthUser.name,
        role: Role.USER,
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await this.db.db.insert(users).values(newUser);

      // Create OAuth account link
      await this.db.db.insert(oauthAccounts).values({
        id: crypto.randomUUID(),
        userId: newUser.id,
        provider: provider,
        providerUserId: oauthUser.providerUserId,
        accessToken: oauthUser.accessToken,
        refreshToken: oauthUser.refreshToken,
        expiresAt: oauthUser.expiresAt,
        createdAt: new Date(),
      });

      user = newUser;
    }

    return this.generateAuthResult(user.id, user.email, user.name, user.role);
  }

  async refreshToken(refreshToken: string): Promise<TokenPair> {
    const tokenHash = this.jwtTokenService.hashToken(refreshToken);
    const record = await this.tokenRepo.validateRefreshToken(tokenHash);

    if (!record) throw AuthException.invalidRefreshToken();

    const user = await this.userRepo.findActiveById(record.userId);
    if (!user) throw AuthException.invalidRefreshToken();

    // Revoke old refresh token
    await this.tokenRepo.revokeRefreshToken(tokenHash);

    // Generate new token pair
    const expiresIn = this.env.get('REFRESH_TOKEN_EXPIRES_IN');
    const expiresAt = this.calculateExpiresAt(expiresIn);
    const newTokenPair = await this.jwtTokenService.generateTokenPair(user.id, user.email, user.role);

    // Store new refresh token
    await this.tokenRepo.storeRefreshToken(
      this.jwtTokenService.hashToken(newTokenPair.refreshToken),
      user.id,
      record.deviceInfo,
      expiresAt,
    );

    return newTokenPair;
  }

  private async incrementFailedLoginAttempts(userId: string): Promise<void> {
    await this.db.db
      .update(users)
      .set({ failedLoginAttempts: users.failedLoginAttempts + 1 })
      .where(eq(users.id, userId));
  }

  private async lockAccount(userId: string): Promise<void> {
    const lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
    await this.db.db
      .update(users)
      .set({ lockoutUntil, failedLoginAttempts: MAX_LOGIN_ATTEMPTS })
      .where(eq(users.id, userId));
  }

  private async resetFailedLoginAttempts(userId: string): Promise<void> {
    await this.db.db
      .update(users)
      .set({ failedLoginAttempts: 0, lockoutUntil: null })
      .where(eq(users.id, userId));
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async generateAuthResult(userId: string, email: string, name: string, role: string): Promise<AuthResult> {
    const tokenPair = await this.jwtTokenService.generateTokenPair(userId, email, role);

    const expiresIn = this.env.get('REFRESH_TOKEN_EXPIRES_IN');
    const expiresAt = this.calculateExpiresAt(expiresIn);

    await this.tokenRepo.storeRefreshToken(
      this.jwtTokenService.hashToken(tokenPair.refreshToken),
      userId,
      null,
      expiresAt,
    );

    return {
      user: { id: userId, email, name, role },
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
    };
  }

  private calculateExpiresAt(expiresIn: string): Date {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return new Date(Date.now() + value * multipliers[unit]);
  }
}
