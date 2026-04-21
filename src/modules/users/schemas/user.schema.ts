import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  isActive: boolean('is_active').notNull().default(true),
  isEmailVerified: boolean('is_email_verified').notNull().default(false),
  isMarketingSubscribed: boolean('is_marketing_subscribed').notNull().default(false),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  description: text('description'),
});

export const userRoles = pgTable('user_roles', {
  userId: uuid('user_id').notNull().references(() => users.id),
  roleId: uuid('role_id').notNull().references(() => roles.id),
});

export const rolePermissions = pgTable('role_permissions', {
  roleId: uuid('role_id').notNull().references(() => roles.id),
  permission: text('permission').notNull(),
});

export const socialAccounts = pgTable('social_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  provider: text('provider').notNull(),
  providerId: text('provider_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Type exports for use in services
export type User = typeof users.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type NewRole = typeof roles.$inferInsert;
