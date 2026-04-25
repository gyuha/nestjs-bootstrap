import type { AuditApplicationService } from '../../application/services/audit-application.service';
import { type QueryAuditLogsDto, AuditLogListResponseDto } from '../../application/dto/audit.dto';
import type { Request } from 'express';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditApplicationService);
    queryLogs(dto: QueryAuditLogsDto, req: Request): Promise<AuditLogListResponseDto>;
}
