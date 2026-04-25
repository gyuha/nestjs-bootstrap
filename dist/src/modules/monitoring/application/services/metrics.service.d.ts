import { TokenUsageRecord, AggregatedMetrics } from "../../domain/entities/token-usage-log.entity";
import { ILogRepository } from "../../infrastructure/repositories/postgres-log.repository";
export interface MetricFilters {
  userId?: string;
  provider?: string;
  startDate?: Date;
  endDate?: Date;
}
export declare class MetricsService {
  private readonly logRepository;
  constructor(logRepository: ILogRepository);
  recordTokenUsage(record: TokenUsageRecord): Promise<void>;
  aggregateMetrics(filters: MetricFilters): Promise<AggregatedMetrics>;
}
