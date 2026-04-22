// src/bootstrap/swagger/swagger.setup.ts
import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const errorSchema = (statusCode: number, example: string) => ({
  properties: {
    success: { type: 'boolean', example: false },
    error: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: statusCode },
        message: { type: 'string', example },
        details: {
          type: 'array',
          items: { type: 'string' },
          nullable: true,
        },
      },
    },
    timestamp: { type: 'string', example: '2026-04-22T10:00:00.000Z' },
  },
});

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('NestJS Bootstrap API')
    .setDescription('DDD 기반 NestJS 백엔드 부트스트랩 API')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addGlobalParameters({
      in: 'header',
      required: false,
      name: 'X-API-Version',
      schema: { type: 'string', default: '1', example: '1' },
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);

  document.components ??= {};
  document.components.schemas ??= {};
  const schemas = document.components.schemas as Record<string, unknown>;
  // biome-ignore lint/complexity/useLiteralKeys: dynamic schema names for OpenAPI spec
  schemas['Error400'] = errorSchema(400, 'Validation failed');
  // biome-ignore lint/complexity/useLiteralKeys: dynamic schema names for OpenAPI spec
  schemas['Error401'] = errorSchema(401, 'Unauthorized');
  // biome-ignore lint/complexity/useLiteralKeys: dynamic schema names for OpenAPI spec
  schemas['Error403'] = errorSchema(403, 'Forbidden');
  // biome-ignore lint/complexity/useLiteralKeys: dynamic schema names for OpenAPI spec
  schemas['Error404'] = errorSchema(404, 'Not Found');
  // biome-ignore lint/complexity/useLiteralKeys: dynamic schema names for OpenAPI spec
  schemas['Error500'] = errorSchema(500, 'Internal server error');

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
}
