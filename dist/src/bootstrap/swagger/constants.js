"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDocumentBuilder =
  exports.SWAGGER_API_TAG =
  exports.SWAGGER_API_DESCRIPTION =
  exports.SWAGGER_API_TITLE =
  exports.SWAGGER_API_VERSION =
    void 0;
const swagger_1 = require("@nestjs/swagger");
exports.SWAGGER_API_VERSION = "v1";
exports.SWAGGER_API_TITLE = "NestJS DDD Bootstrap API";
exports.SWAGGER_API_DESCRIPTION = "Production-ready NestJS backend template with DDD architecture";
exports.SWAGGER_API_TAG = "API";
const createDocumentBuilder = () =>
  new swagger_1.DocumentBuilder()
    .setTitle(exports.SWAGGER_API_TITLE)
    .setDescription(exports.SWAGGER_API_DESCRIPTION)
    .setVersion(exports.SWAGGER_API_VERSION)
    .addBearerAuth()
    .addApiKey()
    .addTag(exports.SWAGGER_API_TAG);
exports.createDocumentBuilder = createDocumentBuilder;
//# sourceMappingURL=constants.js.map
