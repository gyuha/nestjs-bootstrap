import { Injectable } from '@nestjs/common';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import type { DrizzleService } from '../../../../infrastructure/database/drizzle.service';
import { auditLogs, type AuditLog, type NewAuditLog } from '../../../../infrastructure/database/schema/audit-logs.schema';
import type { AuditLogEntity, ActorType, AuditEventType } from '../../domain/entities/audit-log.entity';
import type { AuditLogRepository, AuditLogQuery } from '../../domain/repositories/audit-log.repository.interface';

function toAuditLogEntity(result: AuditLog): AuditLogEntity {
  return {
    id: result.id,
    userId: result.userId ?? null,
    actorType: result.actorType as ActorType,
    eventType: result.eventType as AuditEventType,
    targetResource: result.targetResource ?? null,
    eventData: result.eventData ?? null,
    ipAddress: result.ipAddress ?? null,
    userAgent: result.userAgent ?? null,
    createdAt: result.createdAt,
  };
}

@Injectable()
export class DrizzleAuditRepository implements AuditLogRepository {
  constructor(private readonly db: DrizzleService) {}

  async save(entity: AuditLogEntity): Promise<void> {
    const newLog: NewAuditLog = {
      userId: entity.userId,
      actorType: entity.actorType,
      eventType: entity.eventType,
      targetResource: entity.targetResource,
      eventData: entity.eventData,
      ipAddress: entity.ipAddress,
      userAgent: entity.userAgent,
    };
    await this.db.db.insert(auditLogs).values(newLog);
  }

  async findById(id: string): Promise<AuditLogEntity | null> {
    const result = await this.db.db.select().from(auditLogs).where(eq(auditLogs.id, id)).limit(1);
    return result[0] ? toAuditLogEntity(result[0]) : null;
  }

  async query(filter: AuditLogQuery): Promise<{ data: AuditLogEntity[]; total: number }> {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (filter.userId) conditions.push(eq(auditLogs.userId, filter.userId));
    if (filter.eventType) conditions.push(eq(auditLogs.eventType, filter.eventType));
    if (filter.from) conditions.push(gte(auditLogs.createdAt, filter.from));
    if (filter.to) conditions.push(lte(auditLogs.createdAt, filter.to));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await this.db.db
      .select()
      .from(auditLogs)
      .where(whereClause)
      .orderBy(sql`${auditLogs.createdAt} DESC`)
      .limit(limit)
      .offset(offset);

    const countResult = await this.db.db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(whereClause);

    return {
      data: data.map(toAuditLogEntity),
      total: countResult[0]?.count ?? 0,
    };
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const result = await this.db.db
      .delete(auditLogs)
      .where(sql`${auditLogs.createdAt} < ${date}`);
    return result.rowCount ?? 0;
  }
}