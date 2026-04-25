"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthException = void 0;
const common_1 = require("@nestjs/common");
class AuthException extends common_1.HttpException {
    static invalidCredentials() {
        return new common_1.HttpException({ code: 'AUTH_INVALID_CREDENTIALS', message: 'Invalid email or password' }, common_1.HttpStatus.UNAUTHORIZED);
    }
    static invalidRefreshToken() {
        return new common_1.HttpException({ code: 'AUTH_INVALID_REFRESH_TOKEN', message: 'Invalid or expired refresh token' }, common_1.HttpStatus.UNAUTHORIZED);
    }
    static accountInactive() {
        return new common_1.HttpException({ code: 'AUTH_ACCOUNT_INACTIVE', message: 'Account is inactive' }, common_1.HttpStatus.FORBIDDEN);
    }
    static unauthorized() {
        return new common_1.HttpException({ code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' }, common_1.HttpStatus.UNAUTHORIZED);
    }
    static forbidden() {
        return new common_1.HttpException({ code: 'AUTH_FORBIDDEN', message: 'Forbidden' }, common_1.HttpStatus.FORBIDDEN);
    }
}
exports.AuthException = AuthException;
//# sourceMappingURL=auth.exception.js.map