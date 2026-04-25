import { pgTable, uuid, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const aiTokenUsage = pgTable('ai_token_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  traceId: text('trace_id').notNull().unique(),

  // User info
  userId: uuid('user_id'),

  // Token counts
  promptTokens: integer('prompt_tokens').notNull(),
  completionTokens: integer('completion_tokens').notNull(),
  totalTokens: integer('total_tokens').notNull(),

  // Cost tracking
  estimatedCostUsd: integer('estimated_cost_usd'), // cents

  // Provider
  provider: text('provider').notNull(),
  model: text('model').notNull(),

  createdAt: timestamp('created_at').defaultNow(),
});

export type AiTokenUsage = typeof aiTokenUsage.$inferSelect;
export type NewAiTokenUsage = typeof aiTokenUsage.$inferInsert;
