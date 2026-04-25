"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_VERSION_PREFIX = exports.API_VERSION = void 0;
exports.setupApiVersioning = setupApiVersioning;
const common_1 = require("@nestjs/common");
exports.API_VERSION = 'v1';
exports.API_VERSION_PREFIX = `api/${exports.API_VERSION}`;
function setupApiVersioning(app) {
    app.enableVersioning({
        type: common_1.VersioningType.URI,
        defaultVersion: exports.API_VERSION,
    });
}
//# sourceMappingURL=api-version.decorator.js.map