import type { AuthApplicationService } from '../application/auth-application.service';
import { type LoginPasswordDto, type LoginOAuthDto, type RefreshTokenDto, type RegisterDto, type ResendVerificationDto, type ForgotPasswordDto, type ResetPasswordDto, AuthResponseDto, TokenRefreshResponseDto } from '../application/dto/auth.dto';
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
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
}
