import { Module } from '@nestjs/common';
import { ConfigModule_ } from './config/config.module';
import { DrizzleModule } from './infrastructure/database/drizzle.module';

@Module({
  imports: [ConfigModule_, DrizzleModule],
})
export class AppModule {}