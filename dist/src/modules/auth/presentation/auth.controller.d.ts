import type { AuthApplicationService } from '../application/auth-application.service';
import { type LoginPasswordDto, type LoginOAuthDto, type RefreshTokenDto, type RegisterDto, type ResendVerificationDto, AuthResponseDto, TokenRefreshResponseDto } from '../application/dto/auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthApplicationService);
    loginPassword(dto: LoginPasswordDto): Promise<AuthResponseDto>;
    loginOAuth(dto: LoginOAuthDto): Promise<AuthResponseDto>;
    refreshToken(dto: RefreshTokenDto): Promise<TokenRefreshResponseDto>;
    register(dto: RegisterDto): Promise<AuthResponseDto>;
    verifyEmail(token: string): Promise<{
        message: string;
    }>;
    resendVerification(dto: ResendVerificationDto): Promise<{
        message: string;
    }>;
}
