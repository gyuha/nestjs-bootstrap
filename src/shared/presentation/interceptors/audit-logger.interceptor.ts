// src/shared/presentation/interceptors/audit-logger.interceptor.ts
import { Injectable, Inject, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import type { AuditApplicationService } from '../../../../modules/audit/application/services/audit-application.service';
import type { AuditEventType, ActorType } from '../../../../modules/audit/domain/entities/audit-log.entity';

const AUDIT_LOG_SERVICE = 'AUDIT_LOG_SERVICE';

@Injectable()
export class AuditLoggerInterceptor implements NestInterceptor {
  constructor(
    @Inject(AUDIT_LOG_SERVICE) private readonly auditService: AuditApplicationService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = (request as any).user;

    const ipAddress = request.ip || request.connection?.remoteAddress;
    const userAgent = request.headers['user-agent'];

    return next.handle().pipe(
      tap(async (response) => {
        try {
          const eventType = (request.auditEventType as AuditEventType) || 'API_CALL';
          const actorType: ActorType = user?.role === 'ADMIN' ? 'ADMIN' : user ? 'USER' : 'SYSTEM';

          await this.auditService.logEvent({
            userId: user?.id || null,
            actorType,
            eventType,
            targetResource: `${request.method}:${request.path}`,
            eventData: {
              statusCode: response?.statusCode || 200,
              method: request.method,
              path: request.path,
              query: request.query,
            },
            ipAddress,
            userAgent,
          });
        } catch (error) {
          // Don't fail the request if audit logging fails
          console.error('Audit log error:', error);
        }
      }),
    );
  }
}