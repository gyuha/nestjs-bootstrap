import { HttpException, HttpStatus } from '@nestjs/common';

export class AuthException extends HttpException {
  static invalidCredentials() {
    return new HttpException(
      { code: 'AUTH_INVALID_CREDENTIALS', message: 'Invalid email or password' },
      HttpStatus.UNAUTHORIZED,
    );
  }

  static invalidRefreshToken() {
    return new HttpException(
      { code: 'AUTH_INVALID_REFRESH_TOKEN', message: 'Invalid or expired refresh token' },
      HttpStatus.UNAUTHORIZED,
    );
  }

  static accountInactive() {
    return new HttpException(
      { code: 'AUTH_ACCOUNT_INACTIVE', message: 'Account is inactive' },
      HttpStatus.FORBIDDEN,
    );
  }

  static unauthorized() {
    return new HttpException(
      { code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' },
      HttpStatus.UNAUTHORIZED,
    );
  }

  static forbidden() {
    return new HttpException(
      { code: 'AUTH_FORBIDDEN', message: 'Forbidden' },
      HttpStatus.FORBIDDEN,
    );
  }

  static accountLocked() {
    return new HttpException(
      { code: 'AUTH_ACCOUNT_LOCKED', message: 'Account is temporarily locked due to too many failed login attempts' },
      HttpStatus.LOCKED,
    );
  }

  static emailNotVerified() {
    return new HttpException(
      { code: 'AUTH_EMAIL_NOT_VERIFIED', message: 'Please verify your email address' },
      HttpStatus.FORBIDDEN,
    );
  }

  static invalidResetToken() {
    return new HttpException(
      { code: 'AUTH_INVALID_RESET_TOKEN', message: 'Invalid password reset token' },
      HttpStatus.BAD_REQUEST,
    );
  }

  static resetTokenExpired() {
    return new HttpException(
      { code: 'AUTH_RESET_TOKEN_EXPIRED', message: 'Password reset token has expired' },
      HttpStatus.BAD_REQUEST,
    );
  }

  static invalidMagicLink() {
    return new HttpException(
      { code: 'AUTH_INVALID_MAGIC_LINK', message: 'Invalid or expired magic link' },
      HttpStatus.BAD_REQUEST,
    );
  }

  static emailAlreadyExists() {
    return new HttpException(
      { code: 'AUTH_EMAIL_ALREADY_EXISTS', message: 'An account with this email already exists' },
      HttpStatus.CONFLICT,
    );
  }
}
