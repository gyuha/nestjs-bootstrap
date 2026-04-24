import type { INestApplication } from '@nestjs/common';
import type { AppLogger } from '../../shared/infrastructure/logging/app-logger';
import { NestAppLogger } from '../../shared/infrastructure/logging/app-logger';
import { HttpExceptionFilter } from '../../shared/presentation/filters/http-exception.filter';
import { ResponseEnvelopeInterceptor } from '../../shared/presentation/interceptors/response-envelope.interceptor';
import { createRequestLoggingMiddleware } from '../../shared/presentation/middleware/request-logging.middleware';
import { traceIdMiddleware } from '../../shared/presentation/middleware/trace-id.middleware';

export function setupHttpPipeline(app: INestApplication): void {
  const appLogger = app.get<AppLogger>(NestAppLogger);

  app.use(traceIdMiddleware);
  app.use(createRequestLoggingMiddleware(appLogger));
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
}
