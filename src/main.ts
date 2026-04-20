import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { setupSecurity } from './bootstrap/security/security.setup';
import { setupSwagger } from './bootstrap/swagger/swagger.setup';
import { validateEnv } from './bootstrap/validation/env.schema';
import { HttpExceptionFilter } from './shared/presentation/filters/http-exception.filter';
import { TransformInterceptor } from './shared/presentation/interceptors/transform.interceptor';

async function bootstrap(): Promise<void> {
  const env = validateEnv(process.env as Record<string, unknown>);

  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));

  app.enableVersioning({
    type: VersioningType.HEADER,
    header: 'X-API-Version',
    defaultVersion: '1',
  });

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  setupSecurity(app);

  if (env.NODE_ENV !== 'production') {
    setupSwagger(app);
  }

  await app.listen(env.PORT);
}

bootstrap();
