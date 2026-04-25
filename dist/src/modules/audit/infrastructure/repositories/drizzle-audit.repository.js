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
exports.DrizzleAuditRepository = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const audit_logs_schema_1 = require("../../../../infrastructure/database/schema/audit-logs.schema");
function toAuditLogEntity(result) {
    return {
        id: result.id,
        userId: result.userId ?? null,
        actorType: result.actorType,
        eventType: result.eventType,
        targetResource: result.targetResource ?? null,
        eventData: result.eventData ?? null,
        ipAddress: result.ipAddress ?? null,
        userAgent: result.userAgent ?? null,
        createdAt: result.createdAt,
    };
}
let DrizzleAuditRepository = class DrizzleAuditRepository {
    constructor(db) {
        this.db = db;
    }
    async save(entity) {
        const newLog = {
            userId: entity.userId,
            actorType: entity.actorType,
            eventType: entity.eventType,
            targetResource: entity.targetResource,
            eventData: entity.eventData,
            ipAddress: entity.ipAddress,
            userAgent: entity.userAgent,
        };
        await this.db.db.insert(audit_logs_schema_1.auditLogs).values(newLog);
    }
    async findById(id) {
        const result = await this.db.db.select().from(audit_logs_schema_1.auditLogs).where((0, drizzle_orm_1.eq)(audit_logs_schema_1.auditLogs.id, id)).limit(1);
        return result[0] ? toAuditLogEntity(result[0]) : null;
    }
    async query(filter) {
        const page = filter.page || 1;
        const limit = filter.limit || 20;
        const offset = (page - 1) * limit;
        const conditions = [];
        if (filter.userId)
            conditions.push((0, drizzle_orm_1.eq)(audit_logs_schema_1.auditLogs.userId, filter.userId));
        if (filter.eventType)
            conditions.push((0, drizzle_orm_1.eq)(audit_logs_schema_1.auditLogs.eventType, filter.eventType));
        if (filter.from)
            conditions.push((0, drizzle_orm_1.gte)(audit_logs_schema_1.auditLogs.createdAt, filter.from));
        if (filter.to)
            conditions.push((0, drizzle_orm_1.lte)(audit_logs_schema_1.auditLogs.createdAt, filter.to));
        const whereClause = conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined;
        const data = await this.db.db
            .select()
            .from(audit_logs_schema_1.auditLogs)
            .where(whereClause)
            .orderBy((0, drizzle_orm_1.sql) `${audit_logs_schema_1.auditLogs.createdAt} DESC`)
            .limit(limit)
            .offset(offset);
        const countResult = await this.db.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(audit_logs_schema_1.auditLogs)
            .where(whereClause);
        return {
            data: data.map(toAuditLogEntity),
            total: countResult[0]?.count ?? 0,
        };
    }
    async deleteOlderThan(date) {
        const result = await this.db.db
            .delete(audit_logs_schema_1.auditLogs)
            .where((0, drizzle_orm_1.sql) `${audit_logs_schema_1.auditLogs.createdAt} < ${date}`)
            .returning({ id: audit_logs_schema_1.auditLogs.id });
        return result.length;
    }
};
exports.DrizzleAuditRepository = DrizzleAuditRepository;
exports.DrizzleAuditRepository = DrizzleAuditRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Function])
], DrizzleAuditRepository);
//# sourceMappingURL=drizzle-audit.repository.js.map