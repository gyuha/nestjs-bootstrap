"use strict";
var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
            ? (desc = Object.getOwnPropertyDescriptor(target, key))
            : desc,
      d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_module_1 = require("./config/config.module");
const drizzle_module_1 = require("./infrastructure/database/drizzle.module");
const redis_module_1 = require("./infrastructure/redis/redis.module");
const users_module_1 = require("./modules/users/users.module");
const health_module_1 = require("./bootstrap/health/health.module");
const auth_module_1 = require("./modules/auth/infrastructure/auth.module");
const monitoring_module_1 = require("./modules/monitoring/monitoring.module");
const ai_gateway_module_1 = require("./modules/ai-gateway/ai-gateway.module");
const rag_module_1 = require("./modules/rag/rag.module");
let AppModule = class AppModule {};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate(
  [
    (0, common_1.Module)({
      imports: [
        config_module_1.ConfigModule_,
        drizzle_module_1.DrizzleModule,
        redis_module_1.RedisModule,
        users_module_1.UsersModule,
        health_module_1.HealthModule,
        auth_module_1.AuthModule,
        monitoring_module_1.MonitoringModule,
        ai_gateway_module_1.AiGatewayModule,
        rag_module_1.RagModule,
      ],
    }),
  ],
  AppModule,
);
//# sourceMappingURL=app.module.js.map
