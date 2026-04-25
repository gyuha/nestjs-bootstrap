import { LogEntry, LogFilters } from '../../domain/entities/api-log.entity';
import { DrizzleService } from '../../../../infrastructure/database/drizzle.service';
export declare const LOG_REPOSITORY = "LOG_REPOSITORY";
export interface ILogRepository {
    save(entry: LogEntry): Promise<void>;
    saveTokenUsage(record: any): Promise<void>;
    findMany(filters: LogFilters): Promise<LogEntry[]>;
    aggregateMetrics(filters: any): Promise<any>;
}
export declare class PostgresLogRepository implements ILogRepository {
    private readonly drizzle;
    constructor(drizzle: DrizzleService);
    save(entry: LogEntry): Promise<void>;
    saveTokenUsage(record: any): Promise<void>;
    findMany(filters: LogFilters): Promise<LogEntry[]>;
    aggregateMetrics(filters: any): Promise<any>;
}
