"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiApiLogs = exports.providerEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.providerEnum = (0, pg_core_1.pgEnum)("ai_provider", ["openai", "azure-openai"]);
exports.aiApiLogs = (0, pg_core_1.pgTable)(
  "ai_api_logs",
  {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    traceId: (0, pg_core_1.text)("trace_id").notNull().unique(),
    sessionId: (0, pg_core_1.text)("session_id"),
    userId: (0, pg_core_1.uuid)("user_id"),
    method: (0, pg_core_1.text)("method").notNull(),
    path: (0, pg_core_1.text)("path").notNull(),
    requestBody: (0, pg_core_1.jsonb)("request_body"),
    statusCode: (0, pg_core_1.integer)("status_code").notNull(),
    responseBody: (0, pg_core_1.jsonb)("response_body"),
    latencyMs: (0, pg_core_1.integer)("latency_ms").notNull(),
    provider: (0, exports.providerEnum)("provider"),
    useRag: (0, pg_core_1.boolean)("use_rag").notNull().default(false),
    ragHitRate: (0, pg_core_1.integer)("rag_hit_rate"),
    errorCode: (0, pg_core_1.text)("error_code"),
    errorMessage: (0, pg_core_1.text)("error_message"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
  },
  (table) => ({
    sessionIdIdx: (0, pg_core_1.index)("idx_ai_api_logs_session_id").on(table.sessionId),
    userIdIdx: (0, pg_core_1.index)("idx_ai_api_logs_user_id").on(table.userId),
    providerIdx: (0, pg_core_1.index)("idx_ai_api_logs_provider").on(table.provider),
  }),
);
//# sourceMappingURL=ai-api-logs.schema.js.map
