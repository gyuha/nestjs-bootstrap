# Audit Logging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement comprehensive audit logging system to track user activities, data changes, and API calls for 30 days.

**Architecture:** Single `audit_logs` table with JSONB event data, PostgreSQL-only storage with automatic 30-day cleanup.

**Tech Stack:** NestJS 11, Drizzle ORM, PostgreSQL

---

## File Structure

```
src/infrastructure/database/schema/audit-logs.schema.ts    # NEW: Drizzle schema
src/modules/audit/
├── domain/
│   ├── entities/audit-log.entity.ts                     # NEW
│   ├── value-objects/event-type.value-object.ts          # NEW
│   └── repositories/audit-log.repository.interface.ts   # NEW
├── application/
│   ├── services/audit-application.service.ts            # NEW
│   └── dto/audit.dto.ts                                  # NEW
├── infrastructure/
│   └── repositories/drizzle-audit.repository.ts         # NEW
├── presentation/
│   ├── controllers/audit.controller.ts                   # NEW
│   └── guards/audit-access.guard.ts                      # NEW
└── audit.module.ts                                       # NEW

src/shared/
├── presentation/
│   ├── interceptors/audit-logger.interceptor.ts          # NEW
│   └── decorators/audit-log.decorator.ts                 # NEW
└── infrastructure/email/templates/audit-notification-email.ts  # NEW (optional)

drizzle/migrations/0001_add_audit_logs.sql                 # NEW: Migration
tests/modules/audit/                                      # NEW: Tests
```

---

## Task 1: Create AuditLogs Schema

**Files:**
- Create: `src/infrastructure/database/schema/audit-logs.schema.ts`

- [ ] **Step 1: Write schema**

```typescript
// src/infrastructure/database/schema/audit-logs.schema.ts
import { pgTable, uuid, varchar, timestamp, text, jsonb } from 'drizzle-orm/pg-core';
import { pgEnum } from 'drizzle-orm/pg-core';

export const actorTypeEnum = pgEnum('actor_type', ['USER', 'ADMIN', 'SYSTEM']);
export const eventTypeEnum = pgEnum('event_type', [
  'LOGIN',
  'LOGOUT',
  'LOGIN_FAILED',
  'PASSWORD_CHANGE',
  'EMAIL_VERIFY',
  'USER_CREATE',
  'USER_UPDATE',
  'USER_DELETE',
  'ROLE_CHANGE',
  'ACCOUNT_LOCK',
  'ACCOUNT_UNLOCK',
  'API_CALL',
  'MAGIC_LINK_REQUEST',
  'PASSWORD_RESET_REQUEST',
]);

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id'),
  actorType: actorTypeEnum('actor_type').notNull(),
  eventType: eventTypeEnum('event_type').notNull(),
  targetResource: varchar('target_resource', { length: 255 }),
  eventData: jsonb('event_data'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

- [ ] **Step 2: Commit**

```bash
git add src/infrastructure/database/schema/audit-logs.schema.ts
git commit -m "feat(audit): add audit_logs schema

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 2: Create EventType Value Object

**Files:**
- Create: `src/modules/audit/domain/value-objects/event-type.value-object.ts`

- [ ] **Step 1: Write value object**

```typescript
// src/modules/audit/domain/value-objects/event-type.value-object.ts

export const AuditEventType = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  EMAIL_VERIFY: 'EMAIL_VERIFY',
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  ROLE_CHANGE: 'ROLE_CHANGE',
  ACCOUNT_LOCK: 'ACCOUNT_LOCK',
  ACCOUNT_UNLOCK: 'ACCOUNT_UNLOCK',
  API_CALL: 'API_CALL',
  MAGIC_LINK_REQUEST: 'MAGIC_LINK_REQUEST',
  PASSWORD_RESET_REQUEST: 'PASSWORD_RESET_REQUEST',
} as const;

export type AuditEventType = typeof AuditEventType[keyof typeof AuditEventType];
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/audit/domain/value-objects/event-type.value-object.ts
git commit -m "feat(audit): add AuditEventType value object

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 3: Create AuditLogEntity

**Files:**
- Create: `src/modules/audit/domain/entities/audit-log.entity.ts`

- [ ] **Step 1: Write entity**

```typescript
// src/modules/audit/domain/entities/audit-log.entity.ts
import { AuditEventType } from '../value-objects/event-type.value-object';

export type ActorType = 'USER' | 'ADMIN' | 'SYSTEM';

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
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/audit/domain/entities/audit-log.entity.ts
git commit -m "feat(audit): add AuditLogEntity

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 4: Create AuditLogRepository Interface

**Files:**
- Create: `src/modules/audit/domain/repositories/audit-log.repository.interface.ts`

- [ ] **Step 1: Write interface**

```typescript
// src/modules/audit/domain/repositories/audit-log.repository.interface.ts
import type { AuditLogEntity, ActorType, AuditEventType } from '../entities/audit-log.entity';

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
  query(filter: AuditLogQuery): Promise<{ data: AuditLogEntity[]; total: number }>;
  deleteOlderThan(date: Date): Promise<number>;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/audit/domain/repositories/audit-log.repository.interface.ts
git commit -m "feat(audit): add AuditLogRepository interface

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 5: Create DrizzleAuditRepository

**Files:**
- Create: `src/modules/audit/infrastructure/repositories/drizzle-audit.repository.ts`

- [ ] **Step 1: Write repository**

```typescript
// src/modules/audit/infrastructure/repositories/drizzle-audit.repository.ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/audit/infrastructure/repositories/drizzle-audit.repository.ts
git commit -m "feat(audit): add DrizzleAuditRepository implementation

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 6: Create Audit Application Service

**Files:**
- Create: `src/modules/audit/application/services/audit-application.service.ts`

- [ ] **Step 1: Write service**

```typescript
// src/modules/audit/application/services/audit-application.service.ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/audit/application/services/audit-application.service.ts
git commit -m "feat(audit): add AuditApplicationService

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 7: Create Audit DTO and Controller

**Files:**
- Create: `src/modules/audit/application/dto/audit.dto.ts`
- Create: `src/modules/audit/presentation/controllers/audit.controller.ts`

- [ ] **Step 1: Write DTO**

```typescript
// src/modules/audit/application/dto/audit.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AuditEventType } from '../../domain/value-objects/event-type.value-object';

export class QueryAuditLogsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ enum: AuditEventType })
  @IsOptional()
  @IsEnum(AuditEventType)
  eventType?: AuditEventType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

export class AuditLogResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  userId: string | null;

  @ApiProperty()
  actorType: string;

  @ApiProperty()
  eventType: string;

  @ApiPropertyOptional()
  targetResource: string | null;

  @ApiPropertyOptional()
  eventData: Record<string, any> | null;

  @ApiPropertyOptional()
  ipAddress: string | null;

  @ApiPropertyOptional()
  userAgent: string | null;

  @ApiProperty()
  createdAt: Date;
}

export class AuditLogListResponseDto {
  @ApiProperty({ type: [AuditLogResponseDto] })
  data: AuditLogResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}
```

- [ ] **Step 2: Write Controller**

```typescript
// src/modules/audit/presentation/controllers/audit.controller.ts
import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { AuditApplicationService } from '../../application/services/audit-application.service';
import { QueryAuditLogsDto, AuditLogListResponseDto } from '../../application/dto/audit.dto';
import { Public } from '../../../../shared/presentation/decorators/public.decorator';
import { JwtAuthGuard } from '../../../../modules/auth/presentation/guards/jwt-auth.guard';
import { AuditAccessGuard } from '../guards/audit-access.guard';
import { ResponseEnvelopeInterceptor } from '../../../../shared/presentation/interceptors/response-envelope.interceptor';
import { UseInterceptors } from '@nestjs/common';
import type { Request } from 'express';

@ApiTags('Audit')
@Controller('audit-logs')
@UseGuards(ThrottlerGuard, JwtAuthGuard, AuditAccessGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@UseInterceptors(ResponseEnvelopeInterceptor)
export class AuditController {
  constructor(private readonly auditService: AuditApplicationService) {}

  @Get()
  @ApiOperation({ summary: 'Query audit logs' })
  @ApiResponse({ status: 200, type: AuditLogListResponseDto })
  async queryLogs(@Query() dto: QueryAuditLogsDto, @Req() req: Request): Promise<AuditLogListResponseDto> {
    const user = (req as any).user;
    const filter = {
      userId: dto.userId,
      eventType: dto.eventType,
      from: dto.from ? new Date(dto.from) : undefined,
      to: dto.to ? new Date(dto.to) : undefined,
      page: dto.page,
      limit: dto.limit,
    };
    // AuditAccessGuard applies user filter for non-admin users
    return this.auditService.queryLogs(filter);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/modules/audit/application/dto/audit.dto.ts
git add src/modules/audit/presentation/controllers/audit.controller.ts
git commit -m "feat(audit): add AuditController and DTO

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 8: Create AuditAccessGuard

**Files:**
- Create: `src/modules/audit/presentation/guards/audit-access.guard.ts`

- [ ] **Step 1: Write guard**

```typescript
// src/modules/audit/presentation/guards/audit-access.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../../../modules/users/domain/value-objects/role.value-object';

@Injectable()
export class AuditAccessGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return false;

    // ADMINs can access all logs - no filtering
    if (user.role === Role.ADMIN) return true;

    // REGULAR users can only see their own logs
    // Inject userId filter into query params
    if (!request.query.userId || request.query.userId !== user.id) {
      request.query.userId = user.id;
    }

    return true;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/audit/presentation/guards/audit-access.guard.ts
git commit -m "feat(audit): add AuditAccessGuard

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 9: Create AuditModule

**Files:**
- Create: `src/modules/audit/audit.module.ts`

- [ ] **Step 1: Write module**

```typescript
// src/modules/audit/audit.module.ts
import { Module } from '@nestjs/common';
import { DrizzleModule } from '../../infrastructure/database/drizzle.module';
import { EnvService } from '../../config/env.service';
import { AuditController } from './presentation/controllers/audit.controller';
import { AuditAccessGuard } from './presentation/guards/audit-access.guard';
import { AuditApplicationService } from './application/services/audit-application.service';
import { DrizzleAuditRepository } from './infrastructure/repositories/drizzle-audit.repository';
import type { AuditLogRepository } from './domain/repositories/audit-log.repository.interface';

const AUDIT_LOG_REPOSITORY = 'AUDIT_LOG_REPOSITORY';

@Module({
  imports: [DrizzleModule],
  controllers: [AuditController],
  providers: [
    EnvService,
    AuditApplicationService,
    AuditAccessGuard,
    { provide: AUDIT_LOG_REPOSITORY, useClass: DrizzleAuditRepository },
  ],
  exports: [AuditApplicationService, AUDIT_LOG_REPOSITORY],
})
export class AuditModule {}
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/audit/audit.module.ts
git commit -m "feat(audit): add AuditModule

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 10: Create AuditLogger Interceptor

**Files:**
- Create: `src/shared/presentation/interceptors/audit-logger.interceptor.ts`
- Create: `src/shared/presentation/decorators/audit-log.decorator.ts`

- [ ] **Step 1: Write interceptor**

```typescript
// src/shared/presentation/interceptors/audit-logger.interceptor.ts
import { Injectable, Inject, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import type { AuditApplicationService } from '../../../../modules/audit/application/services/audit-application.service';
import type { AuditEventType, ActorType } from '../../../../modules/audit/domain/entities/audit-log.entity';
import { AUDIT_LOG_REPOSITORY } from '../../../../modules/audit/audit.module';

const AUDIT_LOG_SERVICE = 'AUDIT_LOG_SERVICE';

@Injectable()
export class AuditLoggerInterceptor implements NestInterceptor {
  constructor(
    @Inject(AUDIT_LOG_SERVICE) private readonly auditService: AuditApplicationService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = (request as any).user;

    const ipAddress = request.ip || request.connection?.remoteAddress;
    const userAgent = request.headers['user-agent'];

    return next.handle().pipe(
      tap(async (response) => {
        try {
          const eventType = (request.auditEventType as AuditEventType) || 'API_CALL';
          const actorType: ActorType = user?.role === 'ADMIN' ? 'ADMIN' : user ? 'USER' : 'SYSTEM';

          await this.auditService.logEvent({
            userId: user?.id || null,
            actorType,
            eventType,
            targetResource: `${request.method}:${request.path}`,
            eventData: {
              statusCode: response?.statusCode || 200,
              method: request.method,
              path: request.path,
              query: request.query,
            },
            ipAddress,
            userAgent,
          });
        } catch (error) {
          // Don't fail the request if audit logging fails
          console.error('Audit log error:', error);
        }
      }),
    );
  }
}
```

- [ ] **Step 2: Write decorator**

```typescript
// src/shared/presentation/decorators/audit-log.decorator.ts
import { SetMetadata } from '@nestjs/common';
import type { AuditEventType } from '../../../../modules/audit/domain/entities/audit-log.entity';

export const AUDIT_EVENT_TYPE_KEY = 'auditEventType';

export const AuditLog = (eventType: AuditEventType) => {
  return SetMetadata(AUDIT_EVENT_TYPE_KEY, eventType);
};
```

- [ ] **Step 3: Commit**

```bash
git add src/shared/presentation/interceptors/audit-logger.interceptor.ts
git add src/shared/presentation/decorators/audit-log.decorator.ts
git commit -m "feat(audit): add AuditLoggerInterceptor and AuditLog decorator

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 11: Generate Drizzle Migration

**Files:**
- Create: `drizzle/migrations/0001_add_audit_logs.sql`

- [ ] **Step 1: Generate migration**

Run: `pnpm drizzle-kit generate`
Expected: Creates migration file in `drizzle/migrations/`

- [ ] **Step 2: Review and commit**

```bash
git add drizzle/migrations/
git commit -m "chore(db): add audit_logs migration

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 12: Build and Test

**Files:**
- None (verification only)

- [ ] **Step 1: Run build**

Run: `pnpm build`
Expected: Exit code 0

- [ ] **Step 2: Run lint**

Run: `pnpm biome lint --write ./src`
Expected: Auto-fixes applied

- [ ] **Step 3: Run tests**

Run: `pnpm test`
Expected: All tests pass

- [ ] **Step 4: Commit any lint fixes**

```bash
git add -A
git commit -m "style: apply biome lint auto-fixes

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Create audit_logs schema |
| 2 | Create EventType value object |
| 3 | Create AuditLogEntity |
| 4 | Create AuditLogRepository interface |
| 5 | Create DrizzleAuditRepository implementation |
| 6 | Create AuditApplicationService |
| 7 | Create Audit DTO and Controller |
| 8 | Create AuditAccessGuard |
| 9 | Create AuditModule |
| 10 | Create AuditLoggerInterceptor and decorator |
| 11 | Generate Drizzle migration |
| 12 | Final build and test |
