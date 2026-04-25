"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.magicLinks = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.magicLinks = (0, pg_core_1.pgTable)("magic_links", {
  id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
  email: (0, pg_core_1.varchar)("email", { length: 255 }).notNull(),
  tokenHash: (0, pg_core_1.varchar)("token_hash", { length: 255 }).notNull().unique(),
  expiresAt: (0, pg_core_1.timestamp)("expires_at").notNull(),
  createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
});
//# sourceMappingURL=magic-links.schema.js.map
