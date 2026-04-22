import { Module } from '@nestjs/common';
import { AppCacheModule } from '../../shared/infrastructure/cache/cache.module';
import { DatabaseModule } from '../../shared/infrastructure/database/database.module';
import { QueueModule } from '../../shared/infrastructure/queue/queue.module';
import { RedisModule } from '../../shared/infrastructure/redis/redis.module';
import { StorageModule } from '../../shared/infrastructure/storage/storage.module';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [
    DatabaseModule,
    AppCacheModule,
    RedisModule,
    QueueModule,
    StorageModule,
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
