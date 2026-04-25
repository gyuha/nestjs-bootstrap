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
exports.AiGatewayController = void 0;
const common_1 = require("@nestjs/common");
const api_key_guard_1 = require("../guards/api-key.guard");
const token_usage_interceptor_1 = require("../interceptors/token-usage.interceptor");
const common_2 = require("@nestjs/common");
let AiGatewayController = class AiGatewayController {
  constructor(chatUseCase, embedUseCase) {
    this.chatUseCase = chatUseCase;
    this.embedUseCase = embedUseCase;
  }
  async chat(dto) {
    return this.chatUseCase.execute(dto);
  }
  async embed(dto) {
    return this.embedUseCase.execute(dto);
  }
  async models() {
    return {
      data: [
        { id: "gpt-4o", provider: "openai", name: "GPT-4o" },
        { id: "gpt-4o-mini", provider: "openai", name: "GPT-4o Mini" },
      ],
    };
  }
};
exports.AiGatewayController = AiGatewayController;
__decorate(
  [
    (0, common_1.Post)("chat"),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    (0, common_2.UseInterceptors)(token_usage_interceptor_1.TokenUsageInterceptor),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise),
  ],
  AiGatewayController.prototype,
  "chat",
  null,
);
__decorate(
  [
    (0, common_1.Post)("embed"),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    (0, common_2.UseInterceptors)(token_usage_interceptor_1.TokenUsageInterceptor),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise),
  ],
  AiGatewayController.prototype,
  "embed",
  null,
);
__decorate(
  [
    (0, common_1.Get)("models"),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise),
  ],
  AiGatewayController.prototype,
  "models",
  null,
);
exports.AiGatewayController = AiGatewayController = __decorate(
  [(0, common_1.Controller)("api/v1/ai"), __metadata("design:paramtypes", [Function, Function])],
  AiGatewayController,
);
//# sourceMappingURL=ai-gateway.controller.js.map
