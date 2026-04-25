"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const setup_1 = require("./bootstrap/swagger/setup");
const setup_2 = require("./bootstrap/validation/setup");
const setup_3 = require("./bootstrap/security/setup");
const setup_4 = require("./bootstrap/logging/setup");
const env_service_1 = require("./config/env.service");
const api_version_decorator_1 = require("./shared/presentation/decorators/api-version.decorator");
const jwt_auth_guard_1 = require("./modules/auth/presentation/guards/jwt-auth.guard");
const roles_guard_1 = require("./modules/auth/presentation/guards/roles.guard");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const env = app.get(env_service_1.EnvService);
    (0, api_version_decorator_1.setupApiVersioning)(app);
    (0, setup_4.setupLogging)(app);
    (0, setup_3.setupSecurity)(app, env);
    (0, setup_2.setupValidation)(app);
    (0, setup_1.setupSwagger)(app);
    app.useGlobalGuards(app.get(jwt_auth_guard_1.JwtAuthGuard), app.get(roles_guard_1.RolesGuard));
    await app.listen(3000);
}
bootstrap();
//# sourceMappingURL=main.js.map