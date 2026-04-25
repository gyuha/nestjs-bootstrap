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
exports.DrizzleUserRepository = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const users_schema_1 = require("../../../../infrastructure/database/schema/users.schema");
const user_entity_1 = require("../../domain/entities/user.entity");
const oauth_accounts_schema_1 = require("../../../../infrastructure/database/schema/oauth-accounts.schema");
function toUserEntity(result) {
    return {
        id: result.id,
        email: result.email,
        passwordHash: result.passwordHash,
        name: result.name,
        role: result.role,
        status: result.status,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
    };
}
let DrizzleUserRepository = class DrizzleUserRepository {
    constructor(db) {
        this.db = db;
    }
    async findById(id) {
        const result = await this.db.db.select().from(users_schema_1.users).where((0, drizzle_orm_1.eq)(users_schema_1.users.id, id)).limit(1);
        return result[0] ? toUserEntity(result[0]) : null;
    }
    async findActiveById(id) {
        const result = await this.db.db
            .select()
            .from(users_schema_1.users)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(users_schema_1.users.id, id), (0, drizzle_orm_1.eq)(users_schema_1.users.status, user_entity_1.UserStatus.ACTIVE)))
            .limit(1);
        return result[0] ? toUserEntity(result[0]) : null;
    }
    async findByEmail(email) {
        const result = await this.db.db.select().from(users_schema_1.users).where((0, drizzle_orm_1.eq)(users_schema_1.users.email, email)).limit(1);
        return result[0] ? toUserEntity(result[0]) : null;
    }
    async findByOAuthProvider(provider, providerUserId) {
        const result = await this.db.db
            .select({ user: users_schema_1.users })
            .from(oauth_accounts_schema_1.oauthAccounts)
            .innerJoin(users_schema_1.users, (0, drizzle_orm_1.eq)(oauth_accounts_schema_1.oauthAccounts.userId, users_schema_1.users.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(oauth_accounts_schema_1.oauthAccounts.provider, provider), (0, drizzle_orm_1.eq)(oauth_accounts_schema_1.oauthAccounts.providerUserId, providerUserId)))
            .limit(1);
        return result[0]?.user ? toUserEntity(result[0].user) : null;
    }
    async save(entity) {
        const newUser = {
            email: entity.email,
            passwordHash: entity.passwordHash,
            name: entity.name,
            role: entity.role,
            status: entity.status,
        };
        await this.db.db.insert(users_schema_1.users).values(newUser);
    }
    async update(entity) {
        const { id, ...data } = entity;
        await this.db.db.update(users_schema_1.users).set(data).where((0, drizzle_orm_1.eq)(users_schema_1.users.id, id));
    }
    async delete(id) {
        await this.db.db.delete(users_schema_1.users).where((0, drizzle_orm_1.eq)(users_schema_1.users.id, id));
    }
};
exports.DrizzleUserRepository = DrizzleUserRepository;
exports.DrizzleUserRepository = DrizzleUserRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Function])
], DrizzleUserRepository);
//# sourceMappingURL=drizzle-user.repository.js.map