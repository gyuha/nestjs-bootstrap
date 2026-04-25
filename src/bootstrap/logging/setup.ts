import { NestExpressApplication } from '@nestjs/platform-express';
import { TraceIdInterceptor } from '../../shared/presentation/interceptors/trace-id.interceptor';
import { LoggingInterceptor } from '../../shared/presentation/interceptors/logging.interceptor';
import { GlobalExceptionFilter } from '../../shared/presentation/filters/http-exception.filter';

export function setupLogging(app: NestExpressApplication): void {
  app.useGlobalInterceptors(new TraceIdInterceptor(), new LoggingInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());
}