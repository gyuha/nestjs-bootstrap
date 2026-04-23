/**
 * 데이터베이스 관련 서비스를 하나의 모듈로 묶는 NestJS 모듈.
 *
 * `DatabaseService`(연결 관리)와 `DatabaseHealthService`(헬스체크)를
 * 제공하고 외부 모듈에서 주입받을 수 있도록 exports합니다.
 * DB를 사용하는 다른 모듈에서 `imports: [DatabaseModule]`을 추가하면
 * DatabaseService를 바로 주입받을 수 있습니다.
 */
import { Module } from '@nestjs/common';

import { AppConfigModule } from '../../../bootstrap/config/app-config.module';

import { DatabaseHealthService } from './database-health.service';
import { DatabaseService } from './database.service';

/** DB 연결·헬스체크 서비스를 조립하고 외부에 공개하는 모듈 */
@Module({
  imports: [AppConfigModule],
  providers: [DatabaseService, DatabaseHealthService],
  exports: [DatabaseService, DatabaseHealthService],
})
export class DatabaseModule {}
