import { Injectable, Inject } from '@nestjs/common';
import type { AuditLogEntity, ActorType, AuditEventType } from '../../domain/entities/audit-log.entity';
import type { AuditLogRepository, AuditLogQuery } from '../../domain/repositories/audit-log.repository.interface';
import type { EnvService } from '../../../../config/env.service';

const AUDIT_LOG_REPOSITORY = 'AUDIT_LOG_REPOSITORY';
const CLEANUP_THRESHOLD_DAYS = 30;

@Injectable()
export class AuditApplicationService {
  constructor(
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditRepo: AuditLogRepository,
    private readonly env: EnvService,
  ) {}

  async logEvent(params: {
    userId: string | null;
    actorType: ActorType;
    eventType: AuditEventType;
    targetResource?: string;
    eventData?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    const entity: AuditLogEntity = {
      id: crypto.randomUUID(),
      userId: params.userId,
      actorType: params.actorType,
      eventType: params.eventType,
      targetResource: params.targetResource ?? null,
      eventData: params.eventData ?? null,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
      createdAt: new Date(),
    };
    await this.auditRepo.save(entity);
  }

  async queryLogs(filter: AuditLogQuery): Promise<{ data: AuditLogEntity[]; total: number; page: number; limit: number }> {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const result = await this.auditRepo.query({ ...filter, page, limit });
    return { ...result, page, limit };
  }

  async cleanupOldLogs(): Promise<number> {
    const thresholdDate = new Date(Date.now() - CLEANUP_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);
    return this.auditRepo.deleteOlderThan(thresholdDate);
  }
}
