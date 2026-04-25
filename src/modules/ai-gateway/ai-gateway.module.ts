import { Module, forwardRef } from "@nestjs/common";
import { AiGatewayController } from "./presentation/controllers/ai-gateway.controller";
import { AiAdminController } from "./presentation/controllers/ai-admin.controller";
import { ChatUseCase } from "./application/services/chat-use-case";
import { EmbedUseCase } from "./application/services/embedding-use-case";
import { OpenAIAdapter } from "./infrastructure/adapters/openai.adapter";
import { TokenUsageInterceptor } from "./presentation/interceptors/token-usage.interceptor";
import { MonitoringModule } from "../monitoring/monitoring.module";
import { RagModule } from "../rag/rag.module";
import { AI_GATEWAY_SERVICE } from "./domain/services/ai-gateway-service.token";

@Module({
  imports: [MonitoringModule, forwardRef(() => RagModule)],
  controllers: [AiGatewayController, AiAdminController],
  providers: [
    ChatUseCase,
    EmbedUseCase,
    {
      provide: AI_GATEWAY_SERVICE,
      useFactory: () =>
        new OpenAIAdapter({
          apiKey: process.env.OPENAI_API_KEY ?? "sk-local-dev-placeholder",
          organization: process.env.OPENAI_ORGANIZATION,
          defaultModel: process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini",
          embeddingModel: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
          timeoutMs: 30_000,
        }),
    },
    TokenUsageInterceptor,
  ],
  exports: [AI_GATEWAY_SERVICE],
})
export class AiGatewayModule {}
