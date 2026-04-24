import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { HttpExceptionFilter } from '../../presentation/filters/http-exception.filter';
import { ErrorTrackingService } from './error-tracking.service';

/** 에러 추적 서비스와 전역 HTTP 예외 필터를 등록하는 모니터링 모듈 */
@Global()
@Module({
  providers: [
    ErrorTrackingService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
  exports: [ErrorTrackingService],
})
export class MonitoringModule {}
