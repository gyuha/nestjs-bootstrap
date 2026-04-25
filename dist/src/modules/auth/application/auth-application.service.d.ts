import type { AuthResult } from "../domain/entities/auth.entity";
import type { TokenPair } from "../domain/value-objects/token.value-object";
import { OAuthProvider } from "../domain/value-objects/oauth-provider.value-object";
import type { UserRepository } from "../../users/domain/repository/user.repository.interface";
import type { JwtTokenService } from "../infrastructure/services/jwt-token.service";
import type { AuthTokenRepositoryInterface } from "../domain/repositories/auth-token.repository.interface";
import type { OAuthGoogleService } from "../infrastructure/services/oauth-google.service";
import type { OAuthKakaoService } from "../infrastructure/services/oauth-kakao.service";
import type { DrizzleService } from "../../../infrastructure/database/drizzle.service";
import type { EnvService } from "../../../config/env.service";
import type { EmailServiceInterface } from "../../../shared/infrastructure/email/email-service.interface";
export declare class AuthApplicationService {
  private readonly userRepo;
  private readonly jwtTokenService;
  private readonly _tokenRepo;
  private readonly oauthGoogle;
  private readonly oauthKakao;
  private readonly db;
  private readonly env;
  private readonly emailService;
  constructor(
    userRepo: UserRepository,
    jwtTokenService: JwtTokenService,
    _tokenRepo: AuthTokenRepositoryInterface,
    oauthGoogle: OAuthGoogleService,
    oauthKakao: OAuthKakaoService,
    db: DrizzleService,
    env: EnvService,
    emailService: EmailServiceInterface,
  );
  loginWithPassword(email: string, password: string): Promise<AuthResult>;
  loginWithOAuth(provider: OAuthProvider, code: string): Promise<AuthResult>;
  refreshToken(refreshToken: string): Promise<TokenPair>;
  register(dto: { email: string; password: string; name: string }): Promise<AuthResult>;
  verifyEmail(token: string): Promise<void>;
  resendVerificationEmail(email: string): Promise<void>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
  requestMagicLink(email: string): Promise<void>;
  loginWithMagicLink(token: string): Promise<AuthResult>;
  private generateSecureToken;
  private incrementFailedLoginAttempts;
  private lockAccount;
  private resetFailedLoginAttempts;
  private hashToken;
  private generateAuthResult;
  private calculateExpiresAt;
}
