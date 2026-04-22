import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuditListener } from './audit.listener';
import { AuditService } from './audit.service';

@Module({
  imports: [DatabaseModule],
  providers: [AuditService, AuditListener],
})
export class AuditModule {}
