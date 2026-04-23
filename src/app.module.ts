/**
 * 애플리케이션 루트 모듈.
 *
 * NestJS는 모듈 단위로 기능을 조립합니다. 이 파일은 최상위 모듈로,
 * 모든 하위 모듈을 한 곳에서 연결하는 역할을 합니다.
 *
 * `ThrottlerModule`은 동일 IP에서 분당 60회를 초과하는 요청을 자동으로 차단합니다.
 * `APP_GUARD`로 `ThrottlerGuard`를 등록하면 모든 라우터에 자동 적용됩니다.
 * 속도 제한 설정을 바꾸려면 `throttlers` 배열의 `ttl`·`limit` 값을 수정하세요.
 */
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule, seconds } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './bootstrap/config/app-config.module';
import { HealthModule } from './modules/health/health.module';
import { CacheModule } from './shared/infrastructure/cache/cache.module';
import { DatabaseModule } from './shared/infrastructure/database/database.module';

@Module({
  imports: [
    AppConfigModule,
    CacheModule,
    DatabaseModule,
    HealthModule,
    // 분당 60회 초과 요청을 차단하는 속도 제한 모듈
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: seconds(60),
          limit: 60,
        },
      ],
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      // ThrottlerGuard를 전역 가드로 등록해 모든 엔드포인트에 속도 제한을 적용합니다.
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
