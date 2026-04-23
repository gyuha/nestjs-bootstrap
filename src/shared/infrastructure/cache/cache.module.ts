/**
 * Redis 캐시 관련 서비스를 하나의 모듈로 묶는 NestJS 모듈.
 *
 * `CacheService`(연결 관리), `CacheHealthService`(헬스체크), `CacheExampleService`(사용 예시)를
 * 제공하고 외부 모듈에서 주입받을 수 있도록 exports합니다.
 * 다른 모듈에서 Redis 기능이 필요하면 `imports: [CacheModule]`을 추가하세요.
 */
import { Module } from '@nestjs/common';

import { AppConfigModule } from '../../../bootstrap/config/app-config.module';

import { CacheExampleService } from './cache-example.service';
import { CacheHealthService } from './cache-health.service';
import { CacheService } from './cache.service';

/** Redis 연결·헬스체크·사용 예시 서비스를 조립하고 외부에 공개하는 모듈 */
@Module({
  imports: [AppConfigModule],
  providers: [CacheService, CacheExampleService, CacheHealthService],
  exports: [CacheService, CacheExampleService, CacheHealthService],
})
export class CacheModule {}
