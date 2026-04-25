import type { AuditEventType } from "../value-objects/event-type.value-object";
export type { AuditEventType };
export type ActorType = "USER" | "ADMIN" | "SYSTEM";
export interface AuditLogEntity {
  id: string;
  userId: string | null;
  actorType: ActorType;
  eventType: AuditEventType;
  targetResource: string | null;
  eventData: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}
