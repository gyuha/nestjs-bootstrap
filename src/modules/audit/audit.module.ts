// src/modules/audit/audit.module.ts
import { Module } from "@nestjs/common";
import { DrizzleModule } from "../../infrastructure/database/drizzle.module";
import { EnvService } from "../../config/env.service";
import { AuditController } from "./presentation/controllers/audit.controller";
import { AuditAccessGuard } from "./presentation/guards/audit-access.guard";
import { AuditApplicationService } from "./application/services/audit-application.service";
import { DrizzleAuditRepository } from "./infrastructure/repositories/drizzle-audit.repository";
import type { AuditLogRepository } from "./domain/repositories/audit-log.repository.interface";

const AUDIT_LOG_REPOSITORY = "AUDIT_LOG_REPOSITORY";

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
