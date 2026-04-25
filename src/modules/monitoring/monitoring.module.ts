import { Module } from '@nestjs/common';
import { LoggingService } from './application/services/logging.service';
import { MetricsService } from './application/services/metrics.service';
import { PostgresLogRepository } from './infrastructure/repositories/postgres-log.repository';

@Module({
  providers: [
    LoggingService,
    MetricsService,
    PostgresLogRepository,
  ],
  exports: [LoggingService, MetricsService],
})
export class MonitoringModule {}