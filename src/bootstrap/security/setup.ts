import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { ThrottlerModule } from '@nestjs/throttler';
import { EnvService } from '../../config/env.service';

export function setupSecurity(app: NestExpressApplication, env: EnvService): void {
  app.use(helmet());

  app.enableCors({
    origin: env.get('CORS_ORIGIN'),
    credentials: true,
  });

  app.use(
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),
  );
}
