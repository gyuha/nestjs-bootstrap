import { Inject, Injectable } from '@nestjs/common';
// biome-ignore lint/style/useImportType: NestJS DI requires runtime value for @Inject decorator
import { DRIZZLE_CLIENT } from '../database/database.token';
import { auditLogs } from './schemas/audit-log.schema';

interface AuditLogData {
  userId?: string | null;
  action: string;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}

@Injectable()
export class AuditService {
  constructor(
    // biome-ignore lint/suspicious/noExplicitAny: drizzle client union type not statically resolvable
    @Inject(DRIZZLE_CLIENT) private readonly db: any,
  ) {}

  async log(data: AuditLogData): Promise<void> {
    await this.db.insert(auditLogs).values({
      userId: data.userId ?? null,
      action: data.action,
      ip: data.ip ?? null,
      userAgent: data.userAgent ?? null,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
    });
  }
}
