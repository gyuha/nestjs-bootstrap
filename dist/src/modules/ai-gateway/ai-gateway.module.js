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
exports.AiGatewayModule = void 0;
const common_1 = require("@nestjs/common");
const ai_gateway_controller_1 = require("./presentation/controllers/ai-gateway.controller");
const ai_admin_controller_1 = require("./presentation/controllers/ai-admin.controller");
const chat_use_case_1 = require("./application/services/chat-use-case");
const embedding_use_case_1 = require("./application/services/embedding-use-case");
const openai_adapter_1 = require("./infrastructure/adapters/openai.adapter");
const token_usage_interceptor_1 = require("./presentation/interceptors/token-usage.interceptor");
const monitoring_module_1 = require("../monitoring/monitoring.module");
const rag_module_1 = require("../rag/rag.module");
const ai_gateway_service_token_1 = require("./domain/services/ai-gateway-service.token");
let AiGatewayModule = class AiGatewayModule {};
exports.AiGatewayModule = AiGatewayModule;
exports.AiGatewayModule = AiGatewayModule = __decorate(
  [
    (0, common_1.Module)({
      imports: [
        monitoring_module_1.MonitoringModule,
        (0, common_1.forwardRef)(() => rag_module_1.RagModule),
      ],
      controllers: [
        ai_gateway_controller_1.AiGatewayController,
        ai_admin_controller_1.AiAdminController,
      ],
      providers: [
        chat_use_case_1.ChatUseCase,
        embedding_use_case_1.EmbedUseCase,
        {
          provide: ai_gateway_service_token_1.AI_GATEWAY_SERVICE,
          useFactory: () =>
            new openai_adapter_1.OpenAIAdapter({
              apiKey: process.env.OPENAI_API_KEY ?? "sk-local-dev-placeholder",
              organization: process.env.OPENAI_ORGANIZATION,
              defaultModel: process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini",
              embeddingModel: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
              timeoutMs: 30_000,
            }),
        },
        token_usage_interceptor_1.TokenUsageInterceptor,
      ],
      exports: [ai_gateway_service_token_1.AI_GATEWAY_SERVICE],
    }),
  ],
  AiGatewayModule,
);
//# sourceMappingURL=ai-gateway.module.js.map
