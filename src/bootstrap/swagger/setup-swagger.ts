import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppConfig } from '../config/app-config';

export function setupSwagger(app: INestApplication): void {
  const configService = app.get(ConfigService<AppConfig, true>);
  const appName = configService.get('appName', { infer: true });
  const swagger = configService.get('swagger', { infer: true });

  if (!swagger.enabled) {
    return;
  }

  const documentConfig = new DocumentBuilder()
    .setTitle(appName)
    .setDescription('NestJS DDD Bootstrap API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, documentConfig);
  SwaggerModule.setup(swagger.path, app, document);
}
