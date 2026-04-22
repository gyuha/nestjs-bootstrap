import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { HttpExceptionFilter } from '../../presentation/filters/http-exception.filter';
import { ErrorTrackingService } from './error-tracking.service';

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
