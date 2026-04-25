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
import { AuthTokenRepositoryInterface } from '../domain/repositories/auth-token.repository.interface';

import { AuthController } from '../presentation/auth.controller';
import { JwtAuthGuard } from '../presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../presentation/guards/roles.guard';
import { ResponseEnvelopeInterceptor } from '../../../shared/presentation/interceptors/response-envelope.interceptor';

const AUTH_TOKEN_REPOSITORY = 'AUTH_TOKEN_REPOSITORY';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    DrizzleModule,
    RedisModule,
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    EnvService,
    JwtTokenService,
    OAuthGoogleService,
    OAuthKakaoService,
    { provide: AUTH_TOKEN_REPOSITORY, useClass: RedisPostgresTokenRepository },
    JwtAuthGuard,
    RolesGuard,
    ResponseEnvelopeInterceptor,
  ],
  exports: [JwtTokenService, AUTH_TOKEN_REPOSITORY, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}