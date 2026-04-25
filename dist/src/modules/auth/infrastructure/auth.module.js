"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const env_service_1 = require("../../../config/env.service");
const drizzle_module_1 = require("../../../infrastructure/database/drizzle.module");
const redis_module_1 = require("../../../infrastructure/redis/redis.module");
const users_module_1 = require("../../users/users.module");
const jwt_token_service_1 = require("./services/jwt-token.service");
const oauth_google_service_1 = require("./services/oauth-google.service");
const oauth_kakao_service_1 = require("./services/oauth-kakao.service");
const redis_postgres_token_repository_1 = require("./repositories/redis-postgres-token.repository");
const auth_controller_1 = require("../presentation/auth.controller");
const jwt_auth_guard_1 = require("../presentation/guards/jwt-auth.guard");
const roles_guard_1 = require("../presentation/guards/roles.guard");
const response_envelope_interceptor_1 = require("../../../shared/presentation/interceptors/response-envelope.interceptor");
const AUTH_TOKEN_REPOSITORY = 'AUTH_TOKEN_REPOSITORY';
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            passport_1.PassportModule,
            jwt_1.JwtModule.register({}),
            drizzle_module_1.DrizzleModule,
            redis_module_1.RedisModule,
            users_module_1.UsersModule,
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [
            env_service_1.EnvService,
            jwt_token_service_1.JwtTokenService,
            oauth_google_service_1.OAuthGoogleService,
            oauth_kakao_service_1.OAuthKakaoService,
            { provide: AUTH_TOKEN_REPOSITORY, useClass: redis_postgres_token_repository_1.RedisPostgresTokenRepository },
            jwt_auth_guard_1.JwtAuthGuard,
            roles_guard_1.RolesGuard,
            response_envelope_interceptor_1.ResponseEnvelopeInterceptor,
        ],
        exports: [jwt_token_service_1.JwtTokenService, AUTH_TOKEN_REPOSITORY, jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map