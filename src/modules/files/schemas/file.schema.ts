import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const files = pgTable('files', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  category: text('category').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),
  url: text('url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  mediumUrl: text('medium_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type FileRecord = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;
