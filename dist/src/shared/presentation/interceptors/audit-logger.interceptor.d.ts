import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import type { AuditApplicationService } from '../../../modules/audit/application/services/audit-application.service';
export declare class AuditLoggerInterceptor implements NestInterceptor {
    private readonly auditService;
    constructor(auditService: AuditApplicationService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
