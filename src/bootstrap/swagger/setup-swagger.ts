import type { INestApplication } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export function setupSwagger(app: INestApplication) {
  const config = app.get(ConfigService);

  if (!config.get<boolean>("app.swaggerEnabled")) {
    return;
  }

  const documentConfig = new DocumentBuilder()
    .setTitle("NestJS DDD Bootstrap API")
    .setDescription("Infrastructure foundation API")
    .setVersion("1.0")
    .build();

  const document = SwaggerModule.createDocument(app, documentConfig);
  SwaggerModule.setup("api/docs", app, document);
}
