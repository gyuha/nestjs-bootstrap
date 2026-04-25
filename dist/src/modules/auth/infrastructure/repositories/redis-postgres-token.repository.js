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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisPostgresTokenRepository = void 0;
const common_1 = require("@nestjs/common");
const refresh_tokens_schema_1 = require("../../../../infrastructure/database/schema/refresh-tokens.schema");
const drizzle_orm_1 = require("drizzle-orm");
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60;
let RedisPostgresTokenRepository = class RedisPostgresTokenRepository {
    constructor(redis, db) {
        this.redis = redis;
        this.db = db;
    }
    async storeRefreshToken(tokenHash, userId, deviceInfo, expiresAt) {
        await this.redis.set(`refresh:${tokenHash}`, userId, REFRESH_TOKEN_TTL);
        await this.db.db.insert(refresh_tokens_schema_1.refreshTokens).values({
            tokenHash,
            userId,
            deviceInfo,
            expiresAt,
        });
    }
    async validateRefreshToken(tokenHash) {
        const userId = await this.redis.get(`refresh:${tokenHash}`);
        if (userId) {
            const records = await this.db.db
                .select()
                .from(refresh_tokens_schema_1.refreshTokens)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(refresh_tokens_schema_1.refreshTokens.tokenHash, tokenHash), (0, drizzle_orm_1.isNull)(refresh_tokens_schema_1.refreshTokens.revokedAt)))
                .limit(1);
            const record = records[0];
            if (record && record.expiresAt > new Date()) {
                return {
                    tokenHash: record.tokenHash,
                    userId: record.userId,
                    deviceInfo: record.deviceInfo,
                    expiresAt: record.expiresAt,
                    revokedAt: record.revokedAt,
                };
            }
        }
        return null;
    }
    async revokeRefreshToken(tokenHash) {
        await this.redis.del(`refresh:${tokenHash}`);
        await this.db.db
            .update(refresh_tokens_schema_1.refreshTokens)
            .set({ revokedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(refresh_tokens_schema_1.refreshTokens.tokenHash, tokenHash));
    }
    async revokeAllUserTokens(userId) {
        const tokens = await this.db.db
            .select({ tokenHash: refresh_tokens_schema_1.refreshTokens.tokenHash })
            .from(refresh_tokens_schema_1.refreshTokens)
            .where((0, drizzle_orm_1.eq)(refresh_tokens_schema_1.refreshTokens.userId, userId));
        for (const token of tokens) {
            await this.redis.del(`refresh:${token.tokenHash}`);
        }
        await this.db.db
            .update(refresh_tokens_schema_1.refreshTokens)
            .set({ revokedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(refresh_tokens_schema_1.refreshTokens.userId, userId));
    }
};
exports.RedisPostgresTokenRepository = RedisPostgresTokenRepository;
exports.RedisPostgresTokenRepository = RedisPostgresTokenRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Function, Function])
], RedisPostgresTokenRepository);
//# sourceMappingURL=redis-postgres-token.repository.js.map