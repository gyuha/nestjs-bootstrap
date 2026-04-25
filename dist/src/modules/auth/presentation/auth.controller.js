"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const auth_dto_1 = require("../application/dto/auth.dto");
const public_decorator_1 = require("./decorators/public.decorator");
const response_envelope_interceptor_1 = require("../../../shared/presentation/interceptors/response-envelope.interceptor");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async loginPassword(dto) {
        const result = await this.authService.loginWithPassword(dto.email, dto.password);
        return {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            user: result.user,
        };
    }
    async loginOAuth(dto) {
        const result = await this.authService.loginWithOAuth(dto.provider, dto.code);
        return {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            user: result.user,
        };
    }
    async refreshToken(dto) {
        const tokenPair = await this.authService.refreshToken(dto.refreshToken);
        return {
            accessToken: tokenPair.accessToken,
            refreshToken: tokenPair.refreshToken,
        };
    }
    async register(dto) {
        const result = await this.authService.register(dto);
        return {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            user: result.user,
        };
    }
    async verifyEmail(token) {
        await this.authService.verifyEmail(token);
        return { message: 'Email verified successfully' };
    }
    async resendVerification(dto) {
        await this.authService.resendVerificationEmail(dto.email);
        return { message: 'Verification email sent' };
    }
    async forgotPassword(dto) {
        await this.authService.forgotPassword(dto.email);
        return { message: 'If the email exists, a reset link has been sent' };
    }
    async resetPassword(dto) {
        await this.authService.resetPassword(dto.token, dto.newPassword);
        return { message: 'Password reset successfully' };
    }
    async requestMagicLink(dto) {
        await this.authService.requestMagicLink(dto.email);
        return { message: 'If the email exists, a magic link has been sent' };
    }
    async loginWithMagicLink(token) {
        const result = await this.authService.loginWithMagicLink(token);
        return {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            user: result.user,
        };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('login/password'),
    (0, swagger_1.ApiOperation)({ summary: 'Login with email and password' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: auth_dto_1.AuthResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid credentials' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "loginPassword", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('login/oauth/:provider'),
    (0, swagger_1.ApiOperation)({ summary: 'Login with OAuth provider' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: auth_dto_1.AuthResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'OAuth authentication failed' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "loginOAuth", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('refresh'),
    (0, swagger_1.ApiOperation)({ summary: 'Refresh access token' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: auth_dto_1.TokenRefreshResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid refresh token' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refreshToken", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('register'),
    (0, swagger_1.ApiOperation)({ summary: 'Register a new user' }),
    (0, swagger_1.ApiResponse)({ status: 201, type: auth_dto_1.AuthResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Weak password' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Email already exists' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('verify-email/:token'),
    (0, swagger_1.ApiOperation)({ summary: 'Verify email address' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Email verified successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid or expired token' }),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyEmail", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('resend-verification'),
    (0, swagger_1.ApiOperation)({ summary: 'Resend verification email' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Verification email sent' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resendVerification", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('forgot-password'),
    (0, swagger_1.ApiOperation)({ summary: 'Request password reset email' }),
    (0, swagger_1.ApiResponse)({ status: 200 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('reset-password'),
    (0, swagger_1.ApiOperation)({ summary: 'Reset password with token' }),
    (0, swagger_1.ApiResponse)({ status: 200 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('magic-link'),
    (0, swagger_1.ApiOperation)({ summary: 'Request magic link' }),
    (0, swagger_1.ApiResponse)({ status: 200 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "requestMagicLink", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('magic-link/:token'),
    (0, swagger_1.ApiOperation)({ summary: 'Login with magic link' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: auth_dto_1.AuthResponseDto }),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "loginWithMagicLink", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, common_1.Controller)('auth'),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Unauthorized' }),
    (0, swagger_1.ApiForbiddenResponse)({ description: 'Forbidden' }),
    (0, common_1.UseInterceptors)(response_envelope_interceptor_1.ResponseEnvelopeInterceptor),
    __metadata("design:paramtypes", [Function])
], AuthController);
//# sourceMappingURL=auth.controller.js.map