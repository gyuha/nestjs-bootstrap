import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import type { AppConfig } from './bootstrap/config/app-config';
import { ConfigModule } from './bootstrap/config/config.module';
import { HealthModule } from './modules/health/health.module';
import { NestAppLogger } from './shared/infrastructure/logging/app-logger';

@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => {
        const rateLimit = configService.get('security.rateLimit', { infer: true });

        return {
          throttlers: [
            {
              ttl: rateLimit.ttlSeconds * 1000,
              limit: rateLimit.max,
            },
          ],
        };
      },
    }),
    HealthModule,
  ],
  providers: [
    NestAppLogger,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
