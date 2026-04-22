import { Inject, Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type Redis from 'ioredis';
import type { Queue as BullQueue } from 'bullmq';
// biome-ignore lint/style/useImportType: NestJS DI requires runtime class reference
import { CacheService } from '../../shared/infrastructure/cache/cache.service';
import type { IStorageProvider } from '../../shared/infrastructure/storage/providers/storage-provider.interface';
import { DRIZZLE_CLIENT } from '../../shared/infrastructure/database/database.token';
import { REDIS_CLIENT } from '../../shared/infrastructure/redis/redis.provider';
import { QUEUE_TOKEN } from '../../shared/infrastructure/queue/queue.token';
import { STORAGE_PROVIDER } from '../../shared/infrastructure/storage/storage.token';

type HealthStatus = 'ok' | 'error';

const CHECK_TIMEOUT_MS = 5000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    @Inject(DRIZZLE_CLIENT)
    private readonly db: { run: (query: unknown) => unknown },
    private readonly cacheService: CacheService,
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
    @Inject(QUEUE_TOKEN)
    private readonly queue: BullQueue,
    @Inject(STORAGE_PROVIDER)
    private readonly storage: IStorageProvider,
  ) {}

  async checkDb(): Promise<HealthStatus> {
    try {
      await withTimeout(this.db.run(sql`SELECT 1`) as Promise<unknown>, CHECK_TIMEOUT_MS);
      return 'ok';
    } catch (err) {
      this.logger.error('DB health check failed', err);
      return 'error';
    }
  }

  async checkCache(): Promise<HealthStatus> {
    const key = '__health_check__';
    try {
      await withTimeout(
        (async () => {
          await this.cacheService.set(key, '1', 5);
          await this.cacheService.get(key);
          await this.cacheService.del(key);
        })(),
        CHECK_TIMEOUT_MS,
      );
      return 'ok';
    } catch (err) {
      this.logger.error('Cache health check failed', err);
      return 'error';
    }
  }

  async checkRedis(): Promise<HealthStatus> {
    try {
      await withTimeout(this.redis.ping(), CHECK_TIMEOUT_MS);
      return 'ok';
    } catch (err) {
      this.logger.error('Redis health check failed', err);
      return 'error';
    }
  }

  async checkQueue(): Promise<HealthStatus> {
    try {
      await withTimeout(this.queue.isPaused(), CHECK_TIMEOUT_MS);
      return 'ok';
    } catch (err) {
      this.logger.error('Queue health check failed', err);
      return 'error';
    }
  }

  async checkStorage(): Promise<HealthStatus> {
    try {
      await withTimeout(
        (async () => {
          const key = '__health_check__.txt';
          await this.storage.upload(key, Buffer.from('ok'), 'text/plain');
          await this.storage.delete(key);
        })(),
        CHECK_TIMEOUT_MS,
      );
      return 'ok';
    } catch (err) {
      this.logger.error('Storage health check failed', err);
      return 'error';
    }
  }
}
