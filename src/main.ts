import { join } from 'path';
import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { setupBullBoard } from './bootstrap/admin/bull-board.setup';
import { setupSecurity } from './bootstrap/security/security.setup';
import { setupSwagger } from './bootstrap/swagger/swagger.setup';
import { validateEnv } from './bootstrap/validation/env.schema';
import { TransformInterceptor } from './shared/presentation/interceptors/transform.interceptor';

/** NestJS 애플리케이션을 초기화하고 HTTP 서버를 시작하는 진입점 함수 */
async function bootstrap(): Promise<void> {
  const env = validateEnv(process.env as Record<string, unknown>);

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));

  app.enableVersioning({
    type: VersioningType.HEADER,
    header: 'X-API-Version',
    defaultVersion: '1',
  });

  app.useGlobalInterceptors(new TransformInterceptor());

  setupSecurity(app);

  if (env.NODE_ENV !== 'production') {
    setupSwagger(app);
  }

  setupBullBoard(app);

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(env.PORT);
}

bootstrap().catch((err) => {
  console.error('Application failed to start', err);
  process.exit(1);
});
