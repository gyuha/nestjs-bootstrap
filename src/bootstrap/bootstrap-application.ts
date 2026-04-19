import { type INestApplication, VersioningType } from '@nestjs/common';

import { GlobalExceptionFilter } from '../shared/presentation/global-exception.filter';
import { AppConfigService } from './config/app-config.service';
import { RequestLoggerMiddleware } from './logging/request-logger.middleware';
import { TraceIdMiddleware } from './logging/trace-id.middleware';
import { setupSecurity } from './security/setup-security';
import { setupSwagger } from './swagger/setup-swagger';
import { setupValidation } from './validation/setup-validation';

export async function bootstrapApplication(app: INestApplication) {
  const appConfigService = app.get(AppConfigService);
  const traceIdMiddleware = new TraceIdMiddleware();
  const requestLoggerMiddleware = new RequestLoggerMiddleware();

  app.use(traceIdMiddleware.use.bind(traceIdMiddleware));
  app.use(requestLoggerMiddleware.use.bind(requestLoggerMiddleware));
  app.setGlobalPrefix('api');
  setupSecurity(app);
  setupValidation(app);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.useGlobalFilters(new GlobalExceptionFilter());

  if (appConfigService.nodeEnv !== 'production') {
    setupSwagger(app);
  }
}
