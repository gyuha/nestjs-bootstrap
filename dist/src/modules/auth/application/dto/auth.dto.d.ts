import { OAuthProvider } from '../../domain/value-objects/oauth-provider.value-object';
export declare class LoginPasswordDto {
    email: string;
    password: string;
}
export declare class LoginOAuthDto {
    provider: OAuthProvider;
    code: string;
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
export declare class AuthResponseDto {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
    };
}
export declare class TokenRefreshResponseDto {
    accessToken: string;
    refreshToken: string;
}
export declare class RegisterDto {
    email: string;
    password: string;
    name: string;
}
export declare class ResendVerificationDto {
    email: string;
}
export declare class ForgotPasswordDto {
    email: string;
}
export declare class ResetPasswordDto {
    token: string;
    newPassword: string;
}
