import { Module } from '@nestjs/common';
import { ConfigModule } from './bootstrap/config/config.module';

@Module({
  imports: [ConfigModule],
})
export class AppModule {}
