import { Module } from '@nestjs/common';
import { UserRepository } from './domain/repository/user.repository.interface';
import { DrizzleUserRepository } from './infrastructure/repository/drizzle-user.repository';
import { DrizzleModule } from '../../infrastructure/database/drizzle.module';
import { UsersApplicationService } from './application/users-application.service';
import { UsersController } from './presentation/users.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DrizzleModule, AuthModule],
  providers: [
    { provide: UserRepository, useClass: DrizzleUserRepository },
    UsersApplicationService,
  ],
  controllers: [UsersController],
  exports: [UserRepository],
})
export class UsersModule {}
