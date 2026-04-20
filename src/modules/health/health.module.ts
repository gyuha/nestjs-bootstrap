import { Module } from '@nestjs/common';
import { AppCacheModule } from '../../shared/infrastructure/cache/cache.module';
import { DatabaseModule } from '../../shared/infrastructure/database/database.module';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [DatabaseModule, AppCacheModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
