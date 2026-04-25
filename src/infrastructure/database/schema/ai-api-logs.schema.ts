import { pgTable, uuid, text, timestamp, integer, jsonb, boolean } from 'drizzle-orm/pg-core';

export const aiApiLogs = pgTable('ai_api_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  traceId: text('trace_id').notNull().unique(),
  sessionId: text('session_id'),
  userId: uuid('user_id'),

  // Request
  method: text('method').notNull(),
  path: text('path').notNull(),
  requestBody: jsonb('request_body'),

  // Response
  statusCode: integer('status_code').notNull(),
  responseBody: jsonb('response_body'),

  // Timing
  latencyMs: integer('latency_ms').notNull(),

  // Provider info
  provider: text('provider'), // openai, azure-openai
  model: text('model'),

  // RAG info
  useRag: boolean('use_rag').notNull().default(false),
  ragHitRate: integer('rag_hit_rate'), // 0-100

  // Error
  errorCode: text('error_code'),
  errorMessage: text('error_message'),

  createdAt: timestamp('created_at').defaultNow(),
});

export type AiApiLog = typeof aiApiLogs.$inferSelect;
export type NewAiApiLog = typeof aiApiLogs.$inferInsert;
