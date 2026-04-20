import { Module, forwardRef } from '@nestjs/common';
import { SocialService } from './social.service';
import { SocialController } from './social.controller';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../../shared/infrastructure/database/database.module';

@Module({
  imports: [forwardRef(() => UsersModule), forwardRef(() => AuthModule), DatabaseModule],
  controllers: [SocialController],
  providers: [SocialService],
  exports: [SocialService],
})
export class SocialModule {}
