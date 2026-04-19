import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const healthSnapshots = sqliteTable('health_snapshots', {
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  details: text('details', { mode: 'json' })
    .$type<Record<string, unknown>>()
    .notNull(),
  id: integer('id').primaryKey({ autoIncrement: true }),
  status: text('status').notNull(),
});
