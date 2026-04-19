import { Module } from '@nestjs/common';

import { AppConfigModule } from '../../../bootstrap/config/app-config.module';

import { DatabaseHealthService } from './database-health.service';
import { DatabaseService } from './database.service';

@Module({
  imports: [AppConfigModule],
  providers: [DatabaseService, DatabaseHealthService],
  exports: [DatabaseService, DatabaseHealthService],
})
export class DatabaseModule {}
