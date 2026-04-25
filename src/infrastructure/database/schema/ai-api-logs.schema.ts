import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  boolean,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";

export const providerEnum = pgEnum("ai_provider", ["openai", "azure-openai"]);

export const aiApiLogs = pgTable(
  "ai_api_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    traceId: text("trace_id").notNull().unique(),
    sessionId: text("session_id"),
    userId: uuid("user_id"),

    // Request
    method: text("method").notNull(),
    path: text("path").notNull(),
    requestBody: jsonb("request_body"),

    // Response
    statusCode: integer("status_code").notNull(),
    responseBody: jsonb("response_body"),

    // Timing
    latencyMs: integer("latency_ms").notNull(),

    // Provider info
    provider: providerEnum("provider"),

    // RAG info
    useRag: boolean("use_rag").notNull().default(false),
    ragHitRate: integer("rag_hit_rate"), // 0-100

    // Error
    errorCode: text("error_code"),
    errorMessage: text("error_message"),

    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    sessionIdIdx: index("idx_ai_api_logs_session_id").on(table.sessionId),
    userIdIdx: index("idx_ai_api_logs_user_id").on(table.userId),
    providerIdx: index("idx_ai_api_logs_provider").on(table.provider),
  }),
);

export type AiApiLog = typeof aiApiLogs.$inferSelect;
export type NewAiApiLog = typeof aiApiLogs.$inferInsert;
