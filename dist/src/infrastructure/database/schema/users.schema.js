"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.users = exports.statusEnum = exports.roleEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.roleEnum = (0, pg_core_1.pgEnum)("role", ["USER", "ADMIN"]);
exports.statusEnum = (0, pg_core_1.pgEnum)("status", ["ACTIVE", "INACTIVE"]);
exports.users = (0, pg_core_1.pgTable)("users", {
  id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
  email: (0, pg_core_1.varchar)("email", { length: 255 }).notNull().unique(),
  passwordHash: (0, pg_core_1.varchar)("password_hash", { length: 255 }),
  name: (0, pg_core_1.varchar)("name", { length: 100 }).notNull(),
  role: (0, exports.roleEnum)("role").notNull().default("USER"),
  status: (0, exports.statusEnum)("status").notNull().default("ACTIVE"),
  createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
  updatedAt: (0, pg_core_1.timestamp)("updated_at").notNull().defaultNow(),
  emailVerified: (0, pg_core_1.boolean)("email_verified").notNull().default(false),
  lockoutUntil: (0, pg_core_1.timestamp)("lockout_until"),
  failedLoginAttempts: (0, pg_core_1.integer)("failed_login_attempts").notNull().default(0),
  verificationToken: (0, pg_core_1.varchar)("verification_token", { length: 255 }),
  verificationTokenExpiry: (0, pg_core_1.timestamp)("verification_token_expiry"),
});
//# sourceMappingURL=users.schema.js.map
