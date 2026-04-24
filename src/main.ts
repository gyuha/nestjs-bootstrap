import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import type { AppConfig } from './bootstrap/config/app-config';
import { setupSwagger } from './bootstrap/swagger/setup-swagger';
import { setupValidation } from './bootstrap/validation/setup-validation';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<AppConfig, true>);

  const apiPrefix = configService.get('apiPrefix', { infer: true });
  const apiVersion = configService.get('apiVersion', { infer: true });
  const port = configService.get('port', { infer: true });

  app.setGlobalPrefix(apiPrefix);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: apiVersion,
  });

  setupValidation(app);
  setupSwagger(app);

  await app.listen(port);
}

void bootstrap();
