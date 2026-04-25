import { HttpException } from '@nestjs/common';
export declare class AuthException extends HttpException {
    static invalidCredentials(): HttpException;
    static invalidRefreshToken(): HttpException;
    static accountInactive(): HttpException;
    static unauthorized(): HttpException;
    static forbidden(): HttpException;
    static accountLocked(): HttpException;
    static emailNotVerified(): HttpException;
    static invalidResetToken(): HttpException;
    static resetTokenExpired(): HttpException;
    static invalidMagicLink(): HttpException;
}
