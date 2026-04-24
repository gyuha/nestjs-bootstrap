import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import type { AppConfig } from '../config/app-config';

export function setupSecurity(app: INestApplication): void {
  const configService = app.get(ConfigService<AppConfig, true>);
  const securityConfig = configService.get('security', { infer: true });

  app.use(helmet());

  if (securityConfig.cors.enabled) {
    app.enableCors({
      origin: securityConfig.cors.origin,
    });
  }
}
