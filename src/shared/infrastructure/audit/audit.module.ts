import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuditService } from './audit.service';
import { AuditListener } from './audit.listener';

@Module({
  imports: [DatabaseModule],
  providers: [AuditService, AuditListener],
})
export class AuditModule {}
