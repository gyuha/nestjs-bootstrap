import { Module } from '@nestjs/common';
import { ConfigModule_ } from './config/config.module';
import { DrizzleModule } from './infrastructure/database/drizzle.module';
import { RedisModule } from './infrastructure/redis/redis.module';

@Module({
  imports: [ConfigModule_, DrizzleModule, RedisModule],
})
export class AppModule {}