import { Injectable, type OnApplicationShutdown } from '@nestjs/common';
import { Redis } from 'ioredis';

import { AppConfigService } from '../../../bootstrap/config/app-config.service';

import { CACHE_LAZY_CLIENT_OPTIONS } from './cache.constants';

@Injectable()
export class CacheService implements OnApplicationShutdown {
  readonly client;

  constructor(private readonly appConfigService: AppConfigService) {
    this.client = new Redis({
      host: appConfigService.redisHost,
      port: appConfigService.redisPort,
      password: appConfigService.redisPassword || undefined,
      db: appConfigService.redisDb,
      keyPrefix: appConfigService.redisKeyPrefix,
      ...CACHE_LAZY_CLIENT_OPTIONS,
    });
  }

  buildKey(key: string) {
    const keyPrefix = this.client.options.keyPrefix;

    return `${typeof keyPrefix === 'string' ? keyPrefix : ''}${key}`;
  }

  async ping() {
    return this.client.ping();
  }

  async onApplicationShutdown() {
    if (this.client.status === 'end') {
      return;
    }

    if (this.client.status === 'wait') {
      this.client.disconnect();

      return;
    }

    try {
      await this.client.quit();
    } catch {
      this.client.disconnect();
    }
  }
}
