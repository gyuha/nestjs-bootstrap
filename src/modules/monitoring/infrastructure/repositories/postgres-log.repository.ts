import { Injectable } from '@nestjs/common';
import { LogEntry, LogFilters } from '../../domain/entities/api-log.entity';
import { TokenUsageRecord, AggregatedMetrics } from '../../domain/entities/token-usage-log.entity';
import { DrizzleService } from '../../../../infrastructure/database/drizzle.service';
import { aiApiLogs } from '../../../../infrastructure/database/schema/ai-api-logs.schema';
import { aiTokenUsage } from '../../../../infrastructure/database/schema/ai-token-usage.schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

export const LOG_REPOSITORY = 'LOG_REPOSITORY';

export interface ILogRepository {
  save(entry: LogEntry): Promise<void>;
  saveTokenUsage(record: TokenUsageRecord): Promise<void>;
  findMany(filters: LogFilters): Promise<LogEntry[]>;
  aggregateMetrics(filters: { userId?: string; provider?: string; startDate?: Date; endDate?: Date }): Promise<AggregatedMetrics>;
}

@Injectable()
export class PostgresLogRepository implements ILogRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async save(entry: LogEntry): Promise<void> {
    await this.drizzle.db.insert(aiApiLogs).values({
      traceId: entry.traceId,
      sessionId: entry.sessionId,
      userId: entry.userId,
      method: entry.method,
      path: entry.path,
      statusCode: entry.statusCode,
      latencyMs: entry.latencyMs,
      provider: entry.provider as 'openai' | 'azure-openai',
      useRag: entry.useRag,
      ragHitRate: entry.ragHitRate,
      errorCode: entry.errorCode,
      errorMessage: entry.errorMessage,
    });
  }

  async saveTokenUsage(record: TokenUsageRecord): Promise<void> {
    await this.drizzle.db.insert(aiTokenUsage).values({
      traceId: record.traceId,
      userId: record.userId,
      promptTokens: record.promptTokens,
      completionTokens: record.completionTokens,
      totalTokens: record.totalTokens,
      provider: record.provider as 'openai' | 'azure-openai',
      model: record.model,
      estimatedCostCents: record.estimatedCostCents,
    });
  }

  async findMany(filters: LogFilters): Promise<LogEntry[]> {
    const conditions = [];

    if (filters.userId) {
      conditions.push(eq(aiApiLogs.userId, filters.userId));
    }
    if (filters.sessionId) {
      conditions.push(eq(aiApiLogs.sessionId, filters.sessionId));
    }
    if (filters.provider) {
      conditions.push(eq(aiApiLogs.provider, filters.provider as 'openai' | 'azure-openai'));
    }
    if (filters.startDate) {
      conditions.push(gte(aiApiLogs.createdAt, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(aiApiLogs.createdAt, filters.endDate));
    }

    const limit = filters.limit ?? 100;

    const result = await this.drizzle.db
      .select()
      .from(aiApiLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(aiApiLogs.createdAt))
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

  async aggregateMetrics(filters: { userId?: string; provider?: string; startDate?: Date; endDate?: Date }): Promise<AggregatedMetrics> {
    const conditions = [];

    if (filters.userId) {
      conditions.push(eq(aiApiLogs.userId, filters.userId));
    }
    if (filters.provider) {
      conditions.push(eq(aiApiLogs.provider, filters.provider as 'openai' | 'azure-openai'));
    }
    if (filters.startDate) {
      conditions.push(gte(aiApiLogs.createdAt, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(aiApiLogs.createdAt, filters.endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [result] = await this.drizzle.db
      .select({
        totalRequests: sql<number>`count(*)`,
        totalPromptTokens: sql<number>`sum(${aiTokenUsage.promptTokens})`,
        totalCompletionTokens: sql<number>`sum(${aiTokenUsage.completionTokens})`,
        avgLatencyMs: sql<number>`avg(${aiApiLogs.latencyMs})`,
        errorRate: sql<number>`coalesce(avg(case when ${aiApiLogs.errorCode} is not null then 1 else 0 end), 0)`,
        ragHitRate: sql<number>`coalesce(avg(case when ${aiApiLogs.useRag} = true then ${aiApiLogs.ragHitRate} else null end), 0)`,
        costUsd: sql<number>`coalesce(sum(${aiTokenUsage.estimatedCostCents}) / 100.0, 0)`,
      })
      .from(aiApiLogs)
      .leftJoin(aiTokenUsage, eq(aiApiLogs.traceId, aiTokenUsage.traceId))
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
}
