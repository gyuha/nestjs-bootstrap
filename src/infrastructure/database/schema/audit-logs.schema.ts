import { pgTable, uuid, varchar, timestamp, text, jsonb } from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";

export const actorTypeEnum = pgEnum("actor_type", ["USER", "ADMIN", "SYSTEM"]);
export const eventTypeEnum = pgEnum("event_type", [
  "LOGIN",
  "LOGOUT",
  "LOGIN_FAILED",
  "PASSWORD_CHANGE",
  "EMAIL_VERIFY",
  "USER_CREATE",
  "USER_UPDATE",
  "USER_DELETE",
  "ROLE_CHANGE",
  "ACCOUNT_LOCK",
  "ACCOUNT_UNLOCK",
  "API_CALL",
  "MAGIC_LINK_REQUEST",
  "PASSWORD_RESET_REQUEST",
]);

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id"),
  actorType: actorTypeEnum("actor_type").notNull(),
  eventType: eventTypeEnum("event_type").notNull(),
  targetResource: varchar("target_resource", { length: 255 }),
  eventData: jsonb("event_data"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
