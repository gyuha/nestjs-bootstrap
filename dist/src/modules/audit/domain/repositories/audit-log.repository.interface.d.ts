import type { AuditLogEntity, AuditEventType } from "../entities/audit-log.entity";
export interface AuditLogQuery {
  userId?: string;
  eventType?: AuditEventType;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}
export interface AuditLogRepository {
  save(entity: AuditLogEntity): Promise<void>;
  findById(id: string): Promise<AuditLogEntity | null>;
  query(filter: AuditLogQuery): Promise<{
    data: AuditLogEntity[];
    total: number;
  }>;
  deleteOlderThan(date: Date): Promise<number>;
}
