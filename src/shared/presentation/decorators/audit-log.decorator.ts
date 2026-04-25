// src/shared/presentation/decorators/audit-log.decorator.ts
import { SetMetadata } from "@nestjs/common";
import type { AuditEventType } from "../../../modules/audit/domain/entities/audit-log.entity";

export const AUDIT_EVENT_TYPE_KEY = "auditEventType";

export const AuditLog = (eventType: AuditEventType) => {
  return SetMetadata(AUDIT_EVENT_TYPE_KEY, eventType);
};
