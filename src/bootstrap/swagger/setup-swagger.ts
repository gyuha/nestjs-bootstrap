import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppConfigService } from '../config/app-config.service';

export function setupSwagger(app: INestApplication) {
  const appConfigService = app.get(AppConfigService);

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle(appConfigService.appName)
      .setDescription(appConfigService.appDescription)
      .setVersion(appConfigService.appVersion)
      .build(),
  );

  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs/json',
    useGlobalPrefix: true,
  });
}
