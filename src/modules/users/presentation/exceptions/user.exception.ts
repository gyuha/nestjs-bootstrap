import { HttpException, HttpStatus } from '@nestjs/common';

export class UserException extends HttpException {
  static notFound() {
    return new HttpException(
      { code: 'USER_NOT_FOUND', message: 'User not found' },
      HttpStatus.NOT_FOUND,
    );
  }

  static emailAlreadyExists() {
    return new HttpException(
      { code: 'USER_EMAIL_CONFLICT', message: 'Email already exists' },
      HttpStatus.CONFLICT,
    );
  }

  static accountInactive() {
    return new HttpException(
      { code: 'USER_ACCOUNT_INACTIVE', message: 'User account is inactive' },
      HttpStatus.FORBIDDEN,
    );
  }
}
