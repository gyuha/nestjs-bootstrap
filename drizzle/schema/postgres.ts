import { integer, jsonb, pgTable, text } from 'drizzle-orm/pg-core';

export const healthSnapshots = pgTable('health_snapshots', {
  createdAt: integer('created_at').notNull(),
  details: jsonb('details').$type<Record<string, unknown>>().notNull(),
  id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
  status: text('status').notNull(),
});
