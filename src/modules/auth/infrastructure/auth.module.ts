import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { EnvService } from '../../../config/env.service';
import { DrizzleModule } from '../../../infrastructure/database/drizzle.module';
import { RedisModule } from '../../../infrastructure/redis/redis.module';
import { UsersModule } from '../../users/users.module';

import { JwtTokenService } from './services/jwt-token.service';
import { OAuthGoogleService } from './services/oauth-google.service';
import { OAuthKakaoService } from './services/oauth-kakao.service';
import { RedisPostgresTokenRepository } from './repositories/redis-postgres-token.repository';
import { AuthTokenRepositoryInterface } from './domain/repositories/auth-token.repository.interface';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    DrizzleModule,
    RedisModule,
    UsersModule,
  ],
  providers: [
    EnvService,
    JwtTokenService,
    OAuthGoogleService,
    OAuthKakaoService,
    { provide: AuthTokenRepositoryInterface, useClass: RedisPostgresTokenRepository },
  ],
  exports: [JwtTokenService, AuthTokenRepositoryInterface],
})
export class AuthModule {}