"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSecurity = setupSecurity;
const helmet_1 = require("helmet");
const throttler_1 = require("@nestjs/throttler");
function setupSecurity(app, env) {
    app.use((0, helmet_1.default)());
    app.enableCors({
        origin: env.get('CORS_ORIGIN'),
        credentials: true,
    });
    app.use(throttler_1.ThrottlerModule.forRoot([
        {
            ttl: 60_000,
            limit: 100,
        },
    ]));
}
//# sourceMappingURL=setup.js.map