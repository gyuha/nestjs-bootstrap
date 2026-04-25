import { Module } from '@nestjs/common';
import { ConfigModule_ } from './config/config.module';

@Module({
  imports: [ConfigModule_],
})
export class AppModule {}