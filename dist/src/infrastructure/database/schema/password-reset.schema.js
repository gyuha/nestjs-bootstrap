"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.passwordResetTokens = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_schema_1 = require("./users.schema");
exports.passwordResetTokens = (0, pg_core_1.pgTable)('password_reset_tokens', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').notNull().references(() => users_schema_1.users.id, { onDelete: 'cascade' }),
    tokenHash: (0, pg_core_1.varchar)('token_hash', { length: 255 }).notNull().unique(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
});
//# sourceMappingURL=password-reset.schema.js.map