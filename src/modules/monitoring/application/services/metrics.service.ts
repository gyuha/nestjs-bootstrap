import { Injectable, Inject } from '@nestjs/common';
import { TokenUsageRecord, AggregatedMetrics } from '../../domain/entities/token-usage-log.entity';
import { LOG_REPOSITORY, ILogRepository } from '../../infrastructure/repositories/postgres-log.repository';

export interface MetricFilters {
  userId?: string;
  provider?: string;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class MetricsService {
  constructor(
    @Inject(LOG_REPOSITORY) private readonly logRepository: ILogRepository,
  ) {}

  async recordTokenUsage(record: TokenUsageRecord): Promise<void> {
    await this.logRepository.saveTokenUsage(record);
  }

  async aggregateMetrics(filters: MetricFilters): Promise<AggregatedMetrics> {
    return this.logRepository.aggregateMetrics(filters);
  }
}
