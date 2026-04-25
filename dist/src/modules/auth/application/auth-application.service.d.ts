import type { AuthResult } from '../domain/entities/auth.entity';
import type { TokenPair } from '../domain/value-objects/token.value-object';
import { OAuthProvider } from '../domain/value-objects/oauth-provider.value-object';
import type { UserRepository } from '../../users/domain/repository/user.repository.interface';
import type { JwtTokenService } from '../infrastructure/services/jwt-token.service';
import type { AuthTokenRepositoryInterface } from '../domain/repositories/auth-token.repository.interface';
import type { OAuthGoogleService } from '../infrastructure/services/oauth-google.service';
import type { OAuthKakaoService } from '../infrastructure/services/oauth-kakao.service';
import type { DrizzleService } from '../../../infrastructure/database/drizzle.service';
import type { EnvService } from '../../../config/env.service';
export declare class AuthApplicationService {
    private readonly userRepo;
    private readonly jwtTokenService;
    private readonly tokenRepo;
    private readonly oauthGoogle;
    private readonly oauthKakao;
    private readonly db;
    private readonly env;
    constructor(userRepo: UserRepository, jwtTokenService: JwtTokenService, tokenRepo: AuthTokenRepositoryInterface, oauthGoogle: OAuthGoogleService, oauthKakao: OAuthKakaoService, db: DrizzleService, env: EnvService);
    loginWithPassword(email: string, password: string): Promise<AuthResult>;
    loginWithOAuth(provider: OAuthProvider, code: string): Promise<AuthResult>;
    refreshToken(refreshToken: string): Promise<TokenPair>;
    private generateAuthResult;
    private calculateExpiresAt;
}
