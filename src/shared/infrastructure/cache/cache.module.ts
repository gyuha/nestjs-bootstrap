import { Module } from '@nestjs/common';

import { AppConfigModule } from '../../../bootstrap/config/app-config.module';

import { CacheExampleService } from './cache-example.service';
import { CacheHealthService } from './cache-health.service';
import { CacheService } from './cache.service';

@Module({
  imports: [AppConfigModule],
  providers: [CacheService, CacheExampleService, CacheHealthService],
  exports: [CacheService, CacheExampleService, CacheHealthService],
})
export class CacheModule {}
