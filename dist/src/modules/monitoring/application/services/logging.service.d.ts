import { LogEntry, LogFilters } from '../../domain/entities/api-log.entity';
import { ILogRepository } from '../../infrastructure/repositories/postgres-log.repository';
export declare class LoggingService {
    private readonly logRepository;
    constructor(logRepository: ILogRepository);
    log(entry: LogEntry): Promise<void>;
    findLogs(filters: LogFilters): Promise<LogEntry[]>;
}
