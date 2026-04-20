import { Inject, Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { CacheService } from '../../shared/infrastructure/cache/cache.service';
import { DRIZZLE_CLIENT } from '../../shared/infrastructure/database/database.token';

type HealthStatus = 'ok' | 'error';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    @Inject(DRIZZLE_CLIENT)
    private readonly db: { run: (query: unknown) => unknown },
    private readonly cacheService: CacheService,
  ) {}

  async checkDb(): Promise<HealthStatus> {
    try {
      this.db.run(sql`SELECT 1`);
      return 'ok';
    } catch (err) {
      this.logger.error('DB health check failed', err);
      return 'error';
    }
  }

  async checkCache(): Promise<HealthStatus> {
    const key = '__health_check__';
    try {
      await this.cacheService.set(key, '1', 5);
      await this.cacheService.get(key);
      await this.cacheService.del(key);
      return 'ok';
    } catch (err) {
      this.logger.error('Cache health check failed', err);
      return 'error';
    }
  }
}
