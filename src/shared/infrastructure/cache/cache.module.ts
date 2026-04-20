import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      useFactory: async (config: ConfigService) => {
        if (config.get<string>('NODE_ENV') === 'production') {
          const { redisStore } = await import('cache-manager-ioredis-yet');
          return {
            store: redisStore,
            url: config.getOrThrow<string>('REDIS_URL'),
            ttl: 60,
          };
        }
        return { ttl: 60 };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class AppCacheModule {}
