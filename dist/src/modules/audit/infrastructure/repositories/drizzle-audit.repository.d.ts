import type { DrizzleService } from '../../../../infrastructure/database/drizzle.service';
import type { AuditLogEntity } from '../../domain/entities/audit-log.entity';
import type { AuditLogRepository, AuditLogQuery } from '../../domain/repositories/audit-log.repository.interface';
export declare class DrizzleAuditRepository implements AuditLogRepository {
    private readonly db;
    constructor(db: DrizzleService);
    save(entity: AuditLogEntity): Promise<void>;
    findById(id: string): Promise<AuditLogEntity | null>;
    query(filter: AuditLogQuery): Promise<{
        data: AuditLogEntity[];
        total: number;
    }>;
    deleteOlderThan(date: Date): Promise<number>;
}
