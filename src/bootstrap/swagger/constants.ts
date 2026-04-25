import { DocumentBuilder } from "@nestjs/swagger";
import { API_VERSION } from "../../shared/presentation/decorators/api-version.decorator";

export const SWAGGER_API_VERSION = `v${API_VERSION}`;
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
