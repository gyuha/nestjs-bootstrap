import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

export function setupSecurity(app: INestApplication): void {
  app.use(helmet());

  const config = app.get(ConfigService);
  const rawOrigins = config.get<string>('ALLOWED_ORIGINS', 'http://localhost:3000');
  const allowedOrigins = rawOrigins
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0);

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Version', 'X-Trace-Id'],
    exposedHeaders: ['X-Trace-Id'],
  });
}
