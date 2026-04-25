"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauthAccounts = exports.oauthProviderEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_schema_1 = require("./users.schema");
exports.oauthProviderEnum = (0, pg_core_1.pgEnum)('oauth_provider', ['GOOGLE', 'KAKAO']);
exports.oauthAccounts = (0, pg_core_1.pgTable)('oauth_accounts', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').notNull().references(() => users_schema_1.users.id, { onDelete: 'cascade' }),
    provider: (0, exports.oauthProviderEnum)('provider').notNull(),
    providerUserId: (0, pg_core_1.varchar)('provider_user_id', { length: 255 }).notNull(),
    accessToken: (0, pg_core_1.text)('access_token'),
    refreshToken: (0, pg_core_1.text)('refresh_token'),
    expiresAt: (0, pg_core_1.timestamp)('expires_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
});
//# sourceMappingURL=oauth-accounts.schema.js.map