"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = setupSwagger;
const swagger_1 = require("@nestjs/swagger");
const constants_1 = require("./constants");
function setupSwagger(app) {
    const document = (0, constants_1.createDocumentBuilder)().build();
    const swaggerDocument = swagger_1.SwaggerModule.createDocument(app, document);
    swagger_1.SwaggerModule.setup(`api/docs/${constants_1.SWAGGER_API_VERSION}`, app, swaggerDocument);
}
//# sourceMappingURL=setup.js.map