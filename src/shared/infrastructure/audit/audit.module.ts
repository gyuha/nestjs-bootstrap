import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuditListener } from './audit.listener';
import { AuditService } from './audit.service';

/** 감사 로그 기록 기능을 제공하는 모듈 */
@Module({
  imports: [DatabaseModule],
  providers: [AuditService, AuditListener],
})
export class AuditModule {}
