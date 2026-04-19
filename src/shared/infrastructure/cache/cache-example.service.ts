import { Injectable } from '@nestjs/common';

import { AppConfigService } from '../../../bootstrap/config/app-config.service';

import { CacheService } from './cache.service';

@Injectable()
export class CacheExampleService {
  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly cacheService: CacheService,
  ) {}

  getHealthCacheKey() {
    return this.cacheService.buildKey(this.appConfigService.healthCacheKey);
  }
}
