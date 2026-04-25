import type { INestApplication } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { createDocumentBuilder, SWAGGER_API_VERSION } from './constants';

export function setupSwagger(app: INestApplication): void {
  const document = createDocumentBuilder().build();
  const swaggerDocument = SwaggerModule.createDocument(app, document);
  SwaggerModule.setup(`api/docs/${SWAGGER_API_VERSION}`, app, swaggerDocument);
}