"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserException = void 0;
const common_1 = require("@nestjs/common");
class UserException extends common_1.HttpException {
    static notFound() {
        return new common_1.HttpException({ code: 'USER_NOT_FOUND', message: 'User not found' }, common_1.HttpStatus.NOT_FOUND);
    }
    static emailAlreadyExists() {
        return new common_1.HttpException({ code: 'USER_EMAIL_CONFLICT', message: 'Email already exists' }, common_1.HttpStatus.CONFLICT);
    }
    static accountInactive() {
        return new common_1.HttpException({ code: 'USER_ACCOUNT_INACTIVE', message: 'User account is inactive' }, common_1.HttpStatus.FORBIDDEN);
    }
}
exports.UserException = UserException;
//# sourceMappingURL=user.exception.js.map