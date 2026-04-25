import { Injectable, Inject } from "@nestjs/common";
import { LogEntry, LogFilters } from "../../domain/entities/api-log.entity";
import {
  LOG_REPOSITORY,
  ILogRepository,
} from "../../infrastructure/repositories/postgres-log.repository";

@Injectable()
export class LoggingService {
  constructor(@Inject(LOG_REPOSITORY) private readonly logRepository: ILogRepository) {}

  async log(entry: LogEntry): Promise<void> {
    await this.logRepository.save(entry);
  }

  async findLogs(filters: LogFilters): Promise<LogEntry[]> {
    return this.logRepository.findMany(filters);
  }
}
