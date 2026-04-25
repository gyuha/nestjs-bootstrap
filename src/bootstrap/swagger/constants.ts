import { DocumentBuilder } from "@nestjs/swagger";

export const SWAGGER_API_VERSION = "v1";
export const SWAGGER_API_TITLE = "NestJS DDD Bootstrap API";
export const SWAGGER_API_DESCRIPTION =
  "Production-ready NestJS backend template with DDD architecture";
export const SWAGGER_API_TAG = "API";

export const createDocumentBuilder = () =>
  new DocumentBuilder()
    .setTitle(SWAGGER_API_TITLE)
    .setDescription(SWAGGER_API_DESCRIPTION)
    .setVersion(SWAGGER_API_VERSION)
    .addBearerAuth()
    .addApiKey()
    .addTag(SWAGGER_API_TAG);
