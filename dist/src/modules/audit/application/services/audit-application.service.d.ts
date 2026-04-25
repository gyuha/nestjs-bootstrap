import type { AuditLogEntity, ActorType, AuditEventType } from '../../domain/entities/audit-log.entity';
import type { AuditLogRepository, AuditLogQuery } from '../../domain/repositories/audit-log.repository.interface';
import type { EnvService } from '../../../../config/env.service';
export declare class AuditApplicationService {
    private readonly auditRepo;
    private readonly env;
    constructor(auditRepo: AuditLogRepository, env: EnvService);
    logEvent(params: {
        userId: string | null;
        actorType: ActorType;
        eventType: AuditEventType;
        targetResource?: string;
        eventData?: Record<string, any>;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<void>;
    queryLogs(filter: AuditLogQuery): Promise<{
        data: AuditLogEntity[];
        total: number;
        page: number;
        limit: number;
    }>;
    cleanupOldLogs(): Promise<number>;
}
