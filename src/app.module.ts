import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { pinoConfig } from './bootstrap/logging/pino.config';
import { TraceMiddleware } from './bootstrap/logging/trace.middleware';
import { validateEnv } from './bootstrap/validation/env.schema';
import { HealthModule } from './modules/health/health.module';
import { AppCacheModule } from './shared/infrastructure/cache/cache.module';
import { DatabaseModule } from './shared/infrastructure/database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV ?? 'development'}`,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    LoggerModule.forRoot(pinoConfig),
    DatabaseModule,
    AppCacheModule,
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(TraceMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
