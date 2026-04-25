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
exports.AuthApplicationService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
const node_crypto_1 = require("node:crypto");
const drizzle_orm_1 = require("drizzle-orm");
const oauth_provider_value_object_1 = require("../domain/value-objects/oauth-provider.value-object");
const users_schema_1 = require("../../../infrastructure/database/schema/users.schema");
const oauth_accounts_schema_1 = require("../../../infrastructure/database/schema/oauth-accounts.schema");
const auth_exception_1 = require("../presentation/exceptions/auth.exception");
const role_value_object_1 = require("../../users/domain/value-objects/role.value-object");
const AUTH_TOKEN_REPOSITORY = 'AUTH_TOKEN_REPOSITORY';
const LOCKOUT_DURATION_MS = 5 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 10;
const _VERIFICATION_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;
const _RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000;
const _MAGIC_LINK_EXPIRY_MS = 15 * 60 * 1000;
let AuthApplicationService = class AuthApplicationService {
    constructor(userRepo, jwtTokenService, _tokenRepo, oauthGoogle, oauthKakao, db, env, emailService) {
        this.userRepo = userRepo;
        this.jwtTokenService = jwtTokenService;
        this._tokenRepo = _tokenRepo;
        this.oauthGoogle = oauthGoogle;
        this.oauthKakao = oauthKakao;
        this.db = db;
        this.env = env;
        this.emailService = emailService;
    }
    async loginWithPassword(email, password) {
        const user = await this.userRepo.findByEmail(email);
        if (!user)
            throw auth_exception_1.AuthException.invalidCredentials();
        if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
            throw auth_exception_1.AuthException.accountLocked();
        }
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            await this.incrementFailedLoginAttempts(user.id);
            const updatedUser = await this.userRepo.findByEmail(email);
            if (updatedUser && updatedUser.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS - 1) {
                await this.lockAccount(user.id);
                throw auth_exception_1.AuthException.accountLocked();
            }
            throw auth_exception_1.AuthException.invalidCredentials();
        }
        await this.resetFailedLoginAttempts(user.id);
        return this.generateAuthResult(user.id, user.email, user.name, user.role);
    }
    async loginWithOAuth(provider, code) {
        const oauthService = provider === oauth_provider_value_object_1.OAuthProvider.GOOGLE ? this.oauthGoogle : this.oauthKakao;
        const oauthUser = await oauthService.getUserInfo(provider, code);
        let user = await this.userRepo.findByOAuthProvider(provider, oauthUser.providerUserId);
        if (!user) {
            const newUser = {
                id: crypto.randomUUID(),
                email: oauthUser.email,
                passwordHash: null,
                name: oauthUser.name,
                role: role_value_object_1.Role.USER,
                status: role_value_object_1.UserStatus.ACTIVE,
                emailVerified: true,
                lockoutUntil: null,
                failedLoginAttempts: 0,
                verificationToken: null,
                verificationTokenExpiry: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            await this.db.db.insert(users_schema_1.users).values(newUser);
            await this.db.db.insert(oauth_accounts_schema_1.oauthAccounts).values({
                id: crypto.randomUUID(),
                userId: newUser.id,
                provider: provider,
                providerUserId: oauthUser.providerUserId,
                accessToken: oauthUser.accessToken,
                refreshToken: oauthUser.refreshToken,
                expiresAt: oauthUser.expiresAt,
                createdAt: new Date(),
            });
            user = newUser;
        }
        return this.generateAuthResult(user.id, user.email, user.name, user.role);
    }
    async refreshToken(refreshToken) {
        const tokenHash = this.jwtTokenService.hashToken(refreshToken);
        const record = await this._tokenRepo.validateRefreshToken(tokenHash);
        if (!record)
            throw auth_exception_1.AuthException.invalidRefreshToken();
        const user = await this.userRepo.findActiveById(record.userId);
        if (!user)
            throw auth_exception_1.AuthException.invalidRefreshToken();
        await this._tokenRepo.revokeRefreshToken(tokenHash);
        const expiresIn = this.env.get('REFRESH_TOKEN_EXPIRES_IN');
        const expiresAt = this.calculateExpiresAt(expiresIn);
        const newTokenPair = await this.jwtTokenService.generateTokenPair(user.id, user.email, user.role);
        await this._tokenRepo.storeRefreshToken(this.jwtTokenService.hashToken(newTokenPair.refreshToken), user.id, record.deviceInfo, expiresAt);
        return newTokenPair;
    }
    async incrementFailedLoginAttempts(userId) {
        await this.db.db
            .update(users_schema_1.users)
            .set({ failedLoginAttempts: (0, drizzle_orm_1.sql) `${users_schema_1.users.failedLoginAttempts} + 1` })
            .where((0, drizzle_orm_1.eq)(users_schema_1.users.id, userId));
    }
    async lockAccount(userId) {
        const lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
        await this.db.db
            .update(users_schema_1.users)
            .set({ lockoutUntil, failedLoginAttempts: MAX_LOGIN_ATTEMPTS })
            .where((0, drizzle_orm_1.eq)(users_schema_1.users.id, userId));
    }
    async resetFailedLoginAttempts(userId) {
        await this.db.db
            .update(users_schema_1.users)
            .set({ failedLoginAttempts: 0, lockoutUntil: null })
            .where((0, drizzle_orm_1.eq)(users_schema_1.users.id, userId));
    }
    hashToken(token) {
        return (0, node_crypto_1.createHash)('sha256').update(token).digest('hex');
    }
    async generateAuthResult(userId, email, name, role) {
        const tokenPair = await this.jwtTokenService.generateTokenPair(userId, email, role);
        const expiresIn = this.env.get('REFRESH_TOKEN_EXPIRES_IN');
        const expiresAt = this.calculateExpiresAt(expiresIn);
        await this._tokenRepo.storeRefreshToken(this.jwtTokenService.hashToken(tokenPair.refreshToken), userId, null, expiresAt);
        return {
            user: { id: userId, email, name, role },
            accessToken: tokenPair.accessToken,
            refreshToken: tokenPair.refreshToken,
        };
    }
    calculateExpiresAt(expiresIn) {
        const match = expiresIn.match(/^(\d+)([smhd])$/);
        if (!match)
            return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const value = parseInt(match[1], 10);
        const unit = match[2];
        const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
        return new Date(Date.now() + value * multipliers[unit]);
    }
};
exports.AuthApplicationService = AuthApplicationService;
exports.AuthApplicationService = AuthApplicationService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)(AUTH_TOKEN_REPOSITORY)),
    __metadata("design:paramtypes", [Object, Function, Object, Function, Function, Function, Function, Object])
], AuthApplicationService);
//# sourceMappingURL=auth-application.service.js.map