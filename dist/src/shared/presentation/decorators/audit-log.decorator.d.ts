import type { AuditEventType } from "../../../modules/audit/domain/entities/audit-log.entity";
export declare const AUDIT_EVENT_TYPE_KEY = "auditEventType";
export declare const AuditLog: (
  eventType: AuditEventType,
) => import("@nestjs/common").CustomDecorator<string>;
