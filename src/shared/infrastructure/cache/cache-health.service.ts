import { Injectable } from '@nestjs/common';

import { CACHE_HEALTH_RESPONSE } from './cache.constants';
import { CacheService } from './cache.service';

@Injectable()
export class CacheHealthService {
  constructor(private readonly cacheService: CacheService) {}

  async isHealthy() {
    try {
      return (await this.cacheService.ping()) === CACHE_HEALTH_RESPONSE;
    } catch {
      return false;
    }
  }
}
