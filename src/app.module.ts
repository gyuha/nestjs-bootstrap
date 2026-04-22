import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { pinoConfig } from './bootstrap/logging/pino.config';
import { TraceMiddleware } from './bootstrap/logging/trace.middleware';
import { MetricsModule } from './bootstrap/metrics/metrics.module';
import { validateEnv } from './bootstrap/validation/env.schema';
import { AuthModule } from './modules/auth/auth.module';
import { ChatModule } from './modules/chat/chat.module';
import { FilesModule } from './modules/files/files.module';
import { HealthModule } from './modules/health/health.module';
import { SocialModule } from './modules/social/social.module';
import { UsersModule } from './modules/users/users.module';
import { AuditModule } from './shared/infrastructure/audit/audit.module';
import { AppCacheModule } from './shared/infrastructure/cache/cache.module';
import { DatabaseModule } from './shared/infrastructure/database/database.module';
import { EmailModule } from './shared/infrastructure/email/email.module';
import { GatewayModule } from './shared/infrastructure/gateway/gateway.module';
import { ImageModule } from './shared/infrastructure/image/image.module';
import { MonitoringModule } from './shared/infrastructure/monitoring/monitoring.module';
import { QueueModule } from './shared/infrastructure/queue/queue.module';
import { RedisModule } from './shared/infrastructure/redis/redis.module';
import { StorageModule } from './shared/infrastructure/storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV ?? 'development'}`,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    LoggerModule.forRoot(pinoConfig),
    EventEmitterModule.forRoot(),
    AuditModule,
    GatewayModule,
    ChatModule,
    DatabaseModule,
    RedisModule,
    QueueModule,
    EmailModule,
    StorageModule,
    ImageModule,
    FilesModule,
    AppCacheModule,
    HealthModule,
    UsersModule,
    AuthModule,
    SocialModule,
    MetricsModule,
    MonitoringModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(TraceMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
