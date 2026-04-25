# Audit Logging Design Spec

> **For agentic workers:** This spec serves as input for the implementation plan.

**Goal:** Implement comprehensive audit logging system to track user activities, data changes, and API calls for 30 days.

**Architecture:** Single `audit_logs` table with JSONB event data, PostgreSQL-only storage with automatic 30-day cleanup.

---

## Database Schema

### audit_logs Table

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, default gen_random_uuid() |
| user_id | uuid | Nullable - for non-authenticated API calls |
| actor_type | enum('USER', 'ADMIN', 'SYSTEM') | Who performed the action |
| event_type | enum | Type of event (see Event Types below) |
| target_resource | varchar | Nullable - e.g., "user:uuid" |
| event_data | jsonb | Flexible metadata (request/response info) |
| ip_address | varchar | Client IP address |
| user_agent | text | Client user agent |
| created_at | timestamp | Default now(), used for 30-day cleanup |

### Indexes

- `idx_audit_logs_user_created` on (user_id, created_at)
- `idx_audit_logs_event_created` on (event_type, created_at)
- `idx_audit_logs_created_at` on (created_at)

### Event Types

```
LOGIN, LOGOUT, LOGIN_FAILED,
PASSWORD_CHANGE, EMAIL_VERIFY,
USER_CREATE, USER_UPDATE, USER_DELETE,
ROLE_CHANGE, ACCOUNT_LOCK, ACCOUNT_UNLOCK,
API_CALL,
MAGIC_LINK_REQUEST, PASSWORD_RESET_REQUEST
```

---

## Module Structure

```
src/modules/audit/
├── domain/
│   ├── entities/audit-log.entity.ts
│   ├── value-objects/event-type.value-object.ts
│   └── repositories/audit-log.repository.interface.ts
├── application/
│   ├── services/audit-application.service.ts
│   └── dto/audit.dto.ts
├── infrastructure/
│   ├── repositories/drizzle-audit.repository.ts
│   └── services/audit-logger.service.ts
└── presentation/
    ├── controllers/audit.controller.ts
    └── guards/audit-access.guard.ts
```

---

## AuditLoggerService

An interceptor that intercepts all API requests:
- Extracts request info (userId, endpoint, method, IP, userAgent)
- Records event_data after response (status code, response time)
- Uses `@AuditLog()` decorator to annotate specific methods

---

## Query API

**Endpoint:** `GET /api/v1/audit-logs`

**Query Parameters:**
- `userId` (optional): Filter by user
- `eventType` (optional): Filter by event type
- `from` (optional): Start date
- `to` (optional): End date
- `page` (default: 1): Page number
- `limit` (default: 20): Items per page

**Response:**
```typescript
{
  data: AuditLog[],
  total: number,
  page: number,
  limit: number
}
```

**Access Control:**
- ADMIN: Can query all logs
- USER: Can only query their own logs (userId filter automatically applied)

---

## Automatic Cleanup

PostgreSQL scheduled job or event trigger to delete logs older than 30 days:

```sql
DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '30 days';
```

---

## Implementation Notes

- Use string token DI pattern (not interface types)
- Follow existing DDD 4-layer architecture
- PostgreSQL ONLY - no Redis or Elasticsearch
- Use Drizzle ORM with existing patterns
