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
var __metadata =
  (this && this.__metadata) ||
  function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
      return Reflect.metadata(k, v);
  };
var __param =
  (this && this.__param) ||
  function (paramIndex, decorator) {
    return function (target, key) {
      decorator(target, key, paramIndex);
    };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenUsageInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
let TokenUsageInterceptor = class TokenUsageInterceptor {
  constructor(loggingService, metricsService) {
    this.loggingService = loggingService;
    this.metricsService = metricsService;
  }
  intercept(context, next) {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const path = request.route?.path || url;
    const startTime = Date.now();
    return next.handle().pipe(
      (0, operators_1.tap)(async (response) => {
        const latencyMs = Date.now() - startTime;
        const traceId = response?.traceId ?? crypto.randomUUID();
        const usage = response?.data?.usage;
        if (usage && this.metricsService) {
          await this.metricsService.recordTokenUsage({
            traceId,
            userId: request.user?.id,
            ...usage,
            provider: response.data.provider,
            model: response.data.model,
          });
        }
        if (this.loggingService) {
          await this.loggingService.log({
            traceId,
            sessionId: request.body?.sessionId,
            userId: request.user?.id,
            method,
            path,
            statusCode: response?.statusCode ?? 200,
            latencyMs,
            provider: response?.data?.provider,
            model: response?.data?.model,
            useRag: request.body?.useRag ?? false,
          });
        }
      }),
      (0, operators_1.catchError)((error) => {
        const latencyMs = Date.now() - startTime;
        if (this.loggingService) {
          this.loggingService
            .log({
              traceId: crypto.randomUUID(),
              sessionId: request.body?.sessionId,
              userId: request.user?.id,
              method,
              path,
              statusCode: error.status ?? 500,
              latencyMs,
              useRag: request.body?.useRag ?? false,
              error: error.message,
            })
            .catch(() => {});
        }
        throw error;
      }),
    );
  }
};
exports.TokenUsageInterceptor = TokenUsageInterceptor;
exports.TokenUsageInterceptor = TokenUsageInterceptor = __decorate(
  [
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __param(1, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [Function, Function]),
  ],
  TokenUsageInterceptor,
);
//# sourceMappingURL=token-usage.interceptor.js.map
