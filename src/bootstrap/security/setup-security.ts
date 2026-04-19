import type { INestApplication } from '@nestjs/common';
import helmet from 'helmet';

import { AppConfigService } from '../config/app-config.service';
import { TRACE_ID_HEADER } from '../logging/trace-id.constants';

export function setupSecurity(app: INestApplication) {
  const appConfigService = app.get(AppConfigService);

  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  );

  app.enableCors({
    credentials: true,
    exposedHeaders: [TRACE_ID_HEADER],
    origin: appConfigService.appCorsOrigin,
  });
}
