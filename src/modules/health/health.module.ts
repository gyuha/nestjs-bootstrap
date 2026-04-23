/**
 * 헬스체크 기능을 하나의 모듈로 묶는 NestJS 모듈.
 *
 * `CacheModule`과 `DatabaseModule`을 import해 Redis·DB 헬스 서비스를 사용합니다.
 * NestJS의 모듈 시스템 덕분에 의존성이 명시적으로 선언되며,
 * 이 모듈을 import하면 헬스체크에 필요한 모든 의존성이 자동으로 주입됩니다.
 */
import { Module } from '@nestjs/common';

import { CacheModule } from '../../shared/infrastructure/cache/cache.module';
import { DatabaseModule } from '../../shared/infrastructure/database/database.module';

import { HealthController } from './health.controller';
import { HealthService } from './health.service';

/** 헬스체크 컨트롤러·서비스 및 인프라 모듈 의존성을 조립하는 모듈 */
@Module({
  imports: [CacheModule, DatabaseModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
