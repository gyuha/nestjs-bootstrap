"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupValidation = setupValidation;
const common_1 = require("@nestjs/common");
function setupValidation(app) {
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
}
//# sourceMappingURL=setup.js.map