import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const RedisProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: (config: ConfigService) => {
    const url = config.get<string>('REDIS_URL');
    if (!url) {
      // Return a mock Redis client for environments without Redis
      return {
        get: async () => null,
        set: async () => 'OK',
        setex: async () => 'OK',
        del: async () => 1,
        keys: async () => [],
      } as unknown as Redis;
    }
    return new Redis(url);
  },
  inject: [ConfigService],
};
