"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthException = void 0;
const common_1 = require("@nestjs/common");
class AuthException extends common_1.HttpException {
  static invalidCredentials() {
    return new common_1.HttpException(
      { code: "AUTH_INVALID_CREDENTIALS", message: "Invalid email or password" },
      common_1.HttpStatus.UNAUTHORIZED,
    );
  }
  static invalidRefreshToken() {
    return new common_1.HttpException(
      { code: "AUTH_INVALID_REFRESH_TOKEN", message: "Invalid or expired refresh token" },
      common_1.HttpStatus.UNAUTHORIZED,
    );
  }
  static accountInactive() {
    return new common_1.HttpException(
      { code: "AUTH_ACCOUNT_INACTIVE", message: "Account is inactive" },
      common_1.HttpStatus.FORBIDDEN,
    );
  }
  static unauthorized() {
    return new common_1.HttpException(
      { code: "AUTH_UNAUTHORIZED", message: "Unauthorized" },
      common_1.HttpStatus.UNAUTHORIZED,
    );
  }
  static forbidden() {
    return new common_1.HttpException(
      { code: "AUTH_FORBIDDEN", message: "Forbidden" },
      common_1.HttpStatus.FORBIDDEN,
    );
  }
  static accountLocked() {
    return new common_1.HttpException(
      {
        code: "AUTH_ACCOUNT_LOCKED",
        message: "Account is temporarily locked due to too many failed login attempts",
      },
      common_1.HttpStatus.LOCKED,
    );
  }
  static emailNotVerified() {
    return new common_1.HttpException(
      { code: "AUTH_EMAIL_NOT_VERIFIED", message: "Please verify your email address" },
      common_1.HttpStatus.FORBIDDEN,
    );
  }
  static invalidResetToken() {
    return new common_1.HttpException(
      { code: "AUTH_INVALID_RESET_TOKEN", message: "Invalid password reset token" },
      common_1.HttpStatus.BAD_REQUEST,
    );
  }
  static resetTokenExpired() {
    return new common_1.HttpException(
      { code: "AUTH_RESET_TOKEN_EXPIRED", message: "Password reset token has expired" },
      common_1.HttpStatus.BAD_REQUEST,
    );
  }
  static invalidMagicLink() {
    return new common_1.HttpException(
      { code: "AUTH_INVALID_MAGIC_LINK", message: "Invalid or expired magic link" },
      common_1.HttpStatus.BAD_REQUEST,
    );
  }
  static emailAlreadyExists() {
    return new common_1.HttpException(
      { code: "AUTH_EMAIL_ALREADY_EXISTS", message: "An account with this email already exists" },
      common_1.HttpStatus.CONFLICT,
    );
  }
}
exports.AuthException = AuthException;
//# sourceMappingURL=auth.exception.js.map
