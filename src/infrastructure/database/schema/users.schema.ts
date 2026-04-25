import { pgTable, uuid, varchar, timestamp, pgEnum, boolean, integer } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['USER', 'ADMIN']);
export const statusEnum = pgEnum('status', ['ACTIVE', 'INACTIVE']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  name: varchar('name', { length: 100 }).notNull(),
  role: roleEnum('role').notNull().default('USER'),
  status: statusEnum('status').notNull().default('ACTIVE'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  emailVerified: boolean('email_verified').notNull().default(false),
  lockoutUntil: timestamp('lockout_until'),
  failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
  verificationToken: varchar('verification_token', { length: 255 }),
  verificationTokenExpiry: timestamp('verification_token_expiry'),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;