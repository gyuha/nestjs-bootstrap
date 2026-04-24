import { Inject, Injectable } from '@nestjs/common';
// biome-ignore lint/style/useImportType: NestJS DI requires runtime value for @Inject decorator
import { DRIZZLE_CLIENT } from '../database/database.token';
import { auditLogs } from './schemas/audit-log.schema';

/** 감사 로그 데이터 구조 */
interface AuditLogData {
  userId?: string | null;
  action: string;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}

/** 감사 로그를 데이터베이스에 기록하는 서비스 */
@Injectable()
export class AuditService {
  constructor(
    // biome-ignore lint/suspicious/noExplicitAny: drizzle client union type not statically resolvable
    @Inject(DRIZZLE_CLIENT) private readonly db: any,
  ) {}

  /** 감사 로그 항목을 생성하여 저장한다.
   * @param data 기록할 감사 이벤트 정보
   */
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
