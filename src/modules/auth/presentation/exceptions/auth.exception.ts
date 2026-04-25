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
}
