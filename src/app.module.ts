import { Module } from '@nestjs/common';
import { ConfigModule_ } from './config/config.module';
import { DrizzleModule } from './infrastructure/database/drizzle.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './bootstrap/health/health.module';
import { AuthModule } from './modules/auth/infrastructure/auth.module';

@Module({
  imports: [ConfigModule_, DrizzleModule, RedisModule, UsersModule, HealthModule, AuthModule],
})
export class AppModule {}