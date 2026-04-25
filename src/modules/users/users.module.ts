import { Module } from '@nestjs/common';
import { UserRepository } from './domain/repository/user.repository.interface';
import { DrizzleUserRepository } from './infrastructure/repository/drizzle-user.repository';
import { DrizzleModule } from '../../infrastructure/database/drizzle.module';

@Module({
  imports: [DrizzleModule],
  providers: [{ provide: UserRepository, useClass: DrizzleUserRepository }],
  exports: [UserRepository],
})
export class UsersModule {}