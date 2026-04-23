/**
 * 환경변수 설정을 전역으로 제공하는 모듈.
 *
 * `@Global()` 데코레이터 덕분에 이 모듈을 `AppModule`에 한 번만 등록하면
 * 프로젝트 어디서든 `AppConfigService`를 주입받아 사용할 수 있습니다.
 * `ConfigModule.forRoot()`의 `cache: true`는 환경변수를 파싱 후 메모리에 캐싱해
 * 반복 접근 시 성능을 높입니다.
 * 새로운 환경변수를 추가하려면 `app-config.schema.ts`와 `app-config.service.ts`도 함께 수정하세요.
 */
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppConfigService } from './app-config.service';
import { loadAppConfig } from './load-app-config';

/** 전역 설정 모듈 — AppModule에 한 번만 등록하면 전체 앱에서 사용 가능 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [loadAppConfig],
      // ${VAR} 형태로 다른 환경변수를 참조할 수 있게 합니다.
      expandVariables: true,
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
