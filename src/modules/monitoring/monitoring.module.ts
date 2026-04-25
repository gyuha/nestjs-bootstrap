import { Module } from "@nestjs/common";
import { DrizzleModule } from "../../infrastructure/database/drizzle.module";
import { LoggingService } from "./application/services/logging.service";
import { MetricsService } from "./application/services/metrics.service";
import {
  LOG_REPOSITORY,
  PostgresLogRepository,
} from "./infrastructure/repositories/postgres-log.repository";

@Module({
  imports: [DrizzleModule],
  providers: [
    LoggingService,
    MetricsService,
    { provide: LOG_REPOSITORY, useClass: PostgresLogRepository },
  ],
  exports: [LoggingService, MetricsService],
})
export class MonitoringModule {}
