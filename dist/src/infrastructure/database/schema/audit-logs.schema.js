"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogs = exports.eventTypeEnum = exports.actorTypeEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const pg_core_2 = require("drizzle-orm/pg-core");
exports.actorTypeEnum = (0, pg_core_2.pgEnum)('actor_type', ['USER', 'ADMIN', 'SYSTEM']);
exports.eventTypeEnum = (0, pg_core_2.pgEnum)('event_type', [
    'LOGIN',
    'LOGOUT',
    'LOGIN_FAILED',
    'PASSWORD_CHANGE',
    'EMAIL_VERIFY',
    'USER_CREATE',
    'USER_UPDATE',
    'USER_DELETE',
    'ROLE_CHANGE',
    'ACCOUNT_LOCK',
    'ACCOUNT_UNLOCK',
    'API_CALL',
    'MAGIC_LINK_REQUEST',
    'PASSWORD_RESET_REQUEST',
]);
exports.auditLogs = (0, pg_core_1.pgTable)('audit_logs', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id'),
    actorType: (0, exports.actorTypeEnum)('actor_type').notNull(),
    eventType: (0, exports.eventTypeEnum)('event_type').notNull(),
    targetResource: (0, pg_core_1.varchar)('target_resource', { length: 255 }),
    eventData: (0, pg_core_1.jsonb)('event_data'),
    ipAddress: (0, pg_core_1.varchar)('ip_address', { length: 45 }),
    userAgent: (0, pg_core_1.text)('user_agent'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
});
//# sourceMappingURL=audit-logs.schema.js.map