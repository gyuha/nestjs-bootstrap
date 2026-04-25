"use strict";
var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
            ? (desc = Object.getOwnPropertyDescriptor(target, key))
            : desc,
      d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
var __metadata =
  (this && this.__metadata) ||
  function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
      return Reflect.metadata(k, v);
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresLogRepository = exports.LOG_REPOSITORY = void 0;
const common_1 = require("@nestjs/common");
const drizzle_service_1 = require("../../../../infrastructure/database/drizzle.service");
const ai_api_logs_schema_1 = require("../../../../infrastructure/database/schema/ai-api-logs.schema");
const ai_token_usage_schema_1 = require("../../../../infrastructure/database/schema/ai-token-usage.schema");
const drizzle_orm_1 = require("drizzle-orm");
exports.LOG_REPOSITORY = "LOG_REPOSITORY";
let PostgresLogRepository = class PostgresLogRepository {
  constructor(drizzle) {
    this.drizzle = drizzle;
  }
  async save(entry) {
    await this.drizzle.db.insert(ai_api_logs_schema_1.aiApiLogs).values({
      traceId: entry.traceId,
      sessionId: entry.sessionId,
      userId: entry.userId,
      method: entry.method,
      path: entry.path,
      statusCode: entry.statusCode,
      latencyMs: entry.latencyMs,
      provider: entry.provider,
      useRag: entry.useRag,
      ragHitRate: entry.ragHitRate,
      errorCode: entry.errorCode,
      errorMessage: entry.errorMessage,
    });
  }
  async saveTokenUsage(record) {
    await this.drizzle.db.insert(ai_token_usage_schema_1.aiTokenUsage).values({
      traceId: record.traceId,
      userId: record.userId,
      promptTokens: record.promptTokens,
      completionTokens: record.completionTokens,
      totalTokens: record.totalTokens,
      provider: record.provider,
      model: record.model,
      estimatedCostCents: record.estimatedCostCents,
    });
  }
  async findMany(filters) {
    const conditions = [];
    if (filters.userId) {
      conditions.push((0, drizzle_orm_1.eq)(ai_api_logs_schema_1.aiApiLogs.userId, filters.userId));
    }
    if (filters.sessionId) {
      conditions.push(
        (0, drizzle_orm_1.eq)(ai_api_logs_schema_1.aiApiLogs.sessionId, filters.sessionId),
      );
    }
    if (filters.provider) {
      conditions.push(
        (0, drizzle_orm_1.eq)(ai_api_logs_schema_1.aiApiLogs.provider, filters.provider),
      );
    }
    if (filters.startDate) {
      conditions.push(
        (0, drizzle_orm_1.gte)(ai_api_logs_schema_1.aiApiLogs.createdAt, filters.startDate),
      );
    }
    if (filters.endDate) {
      conditions.push(
        (0, drizzle_orm_1.lte)(ai_api_logs_schema_1.aiApiLogs.createdAt, filters.endDate),
      );
    }
    const limit = filters.limit ?? 100;
    const result = await this.drizzle.db
      .select()
      .from(ai_api_logs_schema_1.aiApiLogs)
      .where(conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined)
      .orderBy((0, drizzle_orm_1.desc)(ai_api_logs_schema_1.aiApiLogs.createdAt))
      .limit(limit);
    return result.map((row) => ({
      traceId: row.traceId,
      sessionId: row.sessionId ?? undefined,
      userId: row.userId ?? undefined,
      method: row.method,
      path: row.path,
      statusCode: row.statusCode,
      latencyMs: row.latencyMs,
      provider: row.provider ?? undefined,
      useRag: row.useRag,
      ragHitRate: row.ragHitRate ?? undefined,
      errorCode: row.errorCode ?? undefined,
      errorMessage: row.errorMessage ?? undefined,
    }));
  }
  async aggregateMetrics(filters) {
    const conditions = [];
    if (filters.userId) {
      conditions.push((0, drizzle_orm_1.eq)(ai_api_logs_schema_1.aiApiLogs.userId, filters.userId));
    }
    if (filters.provider) {
      conditions.push(
        (0, drizzle_orm_1.eq)(ai_api_logs_schema_1.aiApiLogs.provider, filters.provider),
      );
    }
    if (filters.startDate) {
      conditions.push(
        (0, drizzle_orm_1.gte)(ai_api_logs_schema_1.aiApiLogs.createdAt, filters.startDate),
      );
    }
    if (filters.endDate) {
      conditions.push(
        (0, drizzle_orm_1.lte)(ai_api_logs_schema_1.aiApiLogs.createdAt, filters.endDate),
      );
    }
    const whereClause = conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined;
    const [result] = await this.drizzle.db
      .select({
        totalRequests: (0, drizzle_orm_1.sql)`count(*)`,
        totalPromptTokens: (0,
        drizzle_orm_1.sql)`sum(${ai_token_usage_schema_1.aiTokenUsage.promptTokens})`,
        totalCompletionTokens: (0,
        drizzle_orm_1.sql)`sum(${ai_token_usage_schema_1.aiTokenUsage.completionTokens})`,
        avgLatencyMs: (0, drizzle_orm_1.sql)`avg(${ai_api_logs_schema_1.aiApiLogs.latencyMs})`,
        errorRate: (0,
        drizzle_orm_1.sql)`coalesce(avg(case when ${ai_api_logs_schema_1.aiApiLogs.errorCode} is not null then 1 else 0 end), 0)`,
        ragHitRate: (0,
        drizzle_orm_1.sql)`coalesce(avg(case when ${ai_api_logs_schema_1.aiApiLogs.useRag} = true then ${ai_api_logs_schema_1.aiApiLogs.ragHitRate} else null end), 0)`,
        costUsd: (0,
        drizzle_orm_1.sql)`coalesce(sum(${ai_token_usage_schema_1.aiTokenUsage.estimatedCostCents}) / 100.0, 0)`,
      })
      .from(ai_api_logs_schema_1.aiApiLogs)
      .leftJoin(
        ai_token_usage_schema_1.aiTokenUsage,
        (0, drizzle_orm_1.eq)(
          ai_api_logs_schema_1.aiApiLogs.traceId,
          ai_token_usage_schema_1.aiTokenUsage.traceId,
        ),
      )
      .where(whereClause);
    return {
      totalRequests: Number(result?.totalRequests) || 0,
      totalPromptTokens: Number(result?.totalPromptTokens) || 0,
      totalCompletionTokens: Number(result?.totalCompletionTokens) || 0,
      avgLatencyMs: Number(result?.avgLatencyMs) || 0,
      errorRate: Number(result?.errorRate) || 0,
      ragHitRate: Number(result?.ragHitRate) || 0,
      costUsd: Number(result?.costUsd) || 0,
    };
  }
};
exports.PostgresLogRepository = PostgresLogRepository;
exports.PostgresLogRepository = PostgresLogRepository = __decorate(
  [(0, common_1.Injectable)(), __metadata("design:paramtypes", [drizzle_service_1.DrizzleService])],
  PostgresLogRepository,
);
//# sourceMappingURL=postgres-log.repository.js.map
