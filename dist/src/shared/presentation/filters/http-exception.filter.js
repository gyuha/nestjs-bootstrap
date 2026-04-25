"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let GlobalExceptionFilter = class GlobalExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger('Exception');
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const traceId = request.traceId || 'unknown';
        const status = exception instanceof common_1.HttpException ? exception.getStatus() : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const code = exception instanceof common_1.HttpException
            ? exception.getResponse()?.code || this.getDefaultCode(status)
            : 'INTERNAL_ERROR';
        const message = exception instanceof common_1.HttpException
            ? exception.getResponse()?.message || exception.message
            : 'Internal server error';
        this.logger.error(`[${traceId}] ${status} ${code} ${message}`, exception.stack);
        const errorResponse = {
            error: { code, message, details: {} },
            meta: { traceId },
        };
        response.status(status).json(errorResponse);
    }
    getDefaultCode(status) {
        switch (status) {
            case 400: return 'VALIDATION_ERROR';
            case 401: return 'AUTH_UNAUTHORIZED';
            case 403: return 'AUTH_FORBIDDEN';
            case 404: return 'NOT_FOUND';
            case 409: return 'CONFLICT';
            case 500: return 'INTERNAL_ERROR';
            default: return 'INTERNAL_ERROR';
        }
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = __decorate([
    (0, common_1.Injectable)(),
    (0, common_1.Catch)()
], GlobalExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map