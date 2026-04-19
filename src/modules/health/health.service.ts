import { Injectable } from '@nestjs/common';

import { CacheHealthService } from '../../shared/infrastructure/cache/cache-health.service';
import { DatabaseHealthService } from '../../shared/infrastructure/database/database-health.service';

export interface HealthDetails {
  cache: boolean;
  database: boolean;
}

@Injectable()
export class HealthService {
  constructor(
    private readonly cacheHealthService: CacheHealthService,
    private readonly databaseHealthService: DatabaseHealthService,
  ) {}

  async getDetails(): Promise<HealthDetails> {
    const [cache, database] = await Promise.all([
      this.cacheHealthService.isHealthy(),
      this.databaseHealthService.isHealthy(),
    ]);

    return { cache, database };
  }
}
