import { Injectable, Inject } from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
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
import { passwordResetTokens } from '../../../infrastructure/database/schema/password-reset.schema';
import { getPasswordResetEmailHtml, getPasswordResetEmailSubject } from '../../../shared/infrastructure/email/templates/password-reset-email';
import { AuthException } from '../presentation/exceptions/auth.exception';
import { Role, UserStatus } from '../../users/domain/value-objects/role.value-object';
import type { EnvService } from '../../../config/env.service';
import type { EmailServiceInterface } from '../../../shared/infrastructure/email/email-service.interface';
import { validatePassword } from '../../../shared/utils/password.validation';
import { getVerificationEmailHtml, getVerificationEmailSubject } from '../../../shared/infrastructure/email/templates/verification-email';

const AUTH_TOKEN_REPOSITORY = 'AUTH_TOKEN_REPOSITORY';
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const MAX_LOGIN_ATTEMPTS = 10;
const VERIFICATION_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
const MAGIC_LINK_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

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
        emailVerified: true, // OAuth users are pre-verified
        lockoutUntil: null,
        failedLoginAttempts: 0,
        verificationToken: null,
        verificationTokenExpiry: null,
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
    const record = await this._tokenRepo.validateRefreshToken(tokenHash);

    if (!record) throw AuthException.invalidRefreshToken();

    const user = await this.userRepo.findActiveById(record.userId);
    if (!user) throw AuthException.invalidRefreshToken();

    // Revoke old refresh token
    await this._tokenRepo.revokeRefreshToken(tokenHash);

    // Generate new token pair
    const expiresIn = this.env.get('REFRESH_TOKEN_EXPIRES_IN');
    const expiresAt = this.calculateExpiresAt(expiresIn);
    const newTokenPair = await this.jwtTokenService.generateTokenPair(user.id, user.email, user.role);

    // Store new refresh token
    await this._tokenRepo.storeRefreshToken(
      this.jwtTokenService.hashToken(newTokenPair.refreshToken),
      user.id,
      record.deviceInfo,
      expiresAt,
    );

    return newTokenPair;
  }

  async register(dto: { email: string; password: string; name: string }): Promise<AuthResult> {
    // Validate password complexity
    const validation = validatePassword(dto.password);
    if (!validation.isValid) {
      throw new HttpException(
        { code: 'AUTH_WEAK_PASSWORD', message: validation.errors.join(', ') },
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check if user exists
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) throw AuthException.emailAlreadyExists();

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Generate verification token
    const verificationToken = this.generateSecureToken();
    const verificationTokenExpiry = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_MS);

    // Create user
    const newUser = {
      id: crypto.randomUUID(),
      email: dto.email,
      passwordHash,
      name: dto.name,
      role: Role.USER,
      status: UserStatus.ACTIVE,
      emailVerified: false,
      verificationToken,
      verificationTokenExpiry,
      lockoutUntil: null,
      failedLoginAttempts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await this.db.db.insert(users).values(newUser);

    // Send verification email
    const baseUrl = this.env.get('APP_URL') || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/api/v1/auth/verify-email/${verificationToken}`;
    await this.emailService.send({
      to: dto.email,
      subject: getVerificationEmailSubject(),
      html: getVerificationEmailHtml(verificationUrl),
    });

    // Return auth result (but note email is not verified)
    return this.generateAuthResult(newUser.id, newUser.email, newUser.name, newUser.role);
  }

  async verifyEmail(token: string): Promise<void> {
    // Find user by verification token
    const result = await this.db.db
      .select()
      .from(users)
      .where(eq(users.verificationToken, token))
      .limit(1);

    const user = result[0];
    if (!user) throw AuthException.invalidResetToken();
    if (user.verificationTokenExpiry && new Date(user.verificationTokenExpiry) < new Date()) {
      throw AuthException.resetTokenExpired();
    }

    // Update user as verified
    await this.db.db
      .update(users)
      .set({ emailVerified: true, verificationToken: null, verificationTokenExpiry: null })
      .where(eq(users.id, user.id));
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) return; // Silent fail for security

    if (user.emailVerified) return; // Already verified

    // Generate new token
    const verificationToken = this.generateSecureToken();
    const verificationTokenExpiry = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_MS);

    await this.db.db
      .update(users)
      .set({ verificationToken, verificationTokenExpiry })
      .where(eq(users.id, user.id));

    // Send email
    const baseUrl = this.env.get('APP_URL') || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/api/v1/auth/verify-email/${verificationToken}`;
    await this.emailService.send({
      to: email,
      subject: getVerificationEmailSubject(),
      html: getVerificationEmailHtml(verificationUrl),
    });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) return; // Silent fail for security

    // Generate reset token
    const token = this.generateSecureToken();
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

    // Store token
    await this.db.db.insert(passwordResetTokens).values({
      id: crypto.randomUUID(),
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    // Send email
    const baseUrl = this.env.get('APP_URL') || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/api/v1/auth/reset-password/${token}`;
    await this.emailService.send({
      to: email,
      subject: getPasswordResetEmailSubject(),
      html: getPasswordResetEmailHtml(resetUrl),
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Validate password complexity
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      throw new HttpException(
        { code: 'AUTH_WEAK_PASSWORD', message: validation.errors.join(', ') },
        HttpStatus.BAD_REQUEST,
      );
    }

    // Find token
    const tokenHash = this.hashToken(token);
    const results = await this.db.db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.tokenHash, tokenHash))
      .limit(1);

    const resetRecord = results[0];
    if (!resetRecord) throw AuthException.invalidResetToken();
    if (new Date(resetRecord.expiresAt) < new Date()) throw AuthException.resetTokenExpired();

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update user password
    await this.db.db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, resetRecord.userId));

    // Delete used token
    await this.db.db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, resetRecord.id));
  }

  private generateSecureToken(): string {
    return randomBytes(32).toString('hex');
  }

  private async incrementFailedLoginAttempts(userId: string): Promise<void> {
    await this.db.db
      .update(users)
      .set({ failedLoginAttempts: sql`${users.failedLoginAttempts} + 1` })
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

    await this._tokenRepo.storeRefreshToken(
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
