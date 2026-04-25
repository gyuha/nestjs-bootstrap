import { AuditEventType } from "../../domain/value-objects/event-type.value-object";
export declare class QueryAuditLogsDto {
  userId?: string;
  eventType?: AuditEventType;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}
export declare class AuditLogResponseDto {
  id: string;
  userId: string | null;
  actorType: string;
  eventType: string;
  targetResource: string | null;
  eventData: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}
export declare class AuditLogListResponseDto {
  data: AuditLogResponseDto[];
  total: number;
  page: number;
  limit: number;
}
