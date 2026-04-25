"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiTokenUsage = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const ai_api_logs_schema_1 = require("./ai-api-logs.schema");
exports.aiTokenUsage = (0, pg_core_1.pgTable)("ai_token_usage", {
  id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
  traceId: (0, pg_core_1.text)("trace_id").notNull().unique(),
  userId: (0, pg_core_1.uuid)("user_id"),
  promptTokens: (0, pg_core_1.integer)("prompt_tokens").notNull(),
  completionTokens: (0, pg_core_1.integer)("completion_tokens").notNull(),
  totalTokens: (0, pg_core_1.integer)("total_tokens").notNull(),
  estimatedCostCents: (0, pg_core_1.integer)("estimated_cost_cents"),
  provider: (0, ai_api_logs_schema_1.providerEnum)("provider").notNull(),
  model: (0, pg_core_1.text)("model").notNull(),
  createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
//# sourceMappingURL=ai-token-usage.schema.js.map
