import {
  boolean,
  foreignKey,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["USER", "ADMIN"]);
export const userStatus = pgEnum("user_status", ["active", "inactive"]);
export const authProvider = pgEnum("auth_provider", ["password", "google"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  displayName: varchar("display_name", { length: 120 }).notNull(),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  status: userStatus("status").notNull().default("active"),
  role: userRole("role").notNull().default("USER"),
  ...timestamps,
});

export const authIdentities = pgTable(
  "auth_identities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: authProvider("provider").notNull(),
    providerUserId: varchar("provider_user_id", { length: 255 }).notNull(),
    passwordHash: text("password_hash"),
    emailVerified: boolean("email_verified").notNull().default(false),
    ...timestamps,
  },
  (table) => [
    unique("auth_identities_provider_provider_user_id_unique").on(
      table.provider,
      table.providerUserId,
    ),
    unique("auth_identities_user_id_provider_unique").on(table.userId, table.provider),
  ],
);

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    replacedByTokenId: uuid("replaced_by_token_id"),
    userAgent: text("user_agent"),
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.replacedByTokenId],
      foreignColumns: [table.id],
      name: "refresh_tokens_replaced_by_token_id_fk",
    }).onDelete("set null"),
  ],
);

export const schema = {
  userRole,
  userStatus,
  authProvider,
  users,
  authIdentities,
  refreshTokens,
};
