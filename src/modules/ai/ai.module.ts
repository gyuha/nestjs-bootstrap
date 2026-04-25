import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AI_CHAT_PROVIDER } from "./domain/ai-chat.provider";
import { EMBEDDING_PROVIDER } from "./domain/embedding.provider";
import { OpenAiProvider } from "./infrastructure/openai-ai.provider";

@Module({
  providers: [
    {
      provide: OpenAiProvider,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return new OpenAiProvider(config);
      },
    },
    {
      provide: AI_CHAT_PROVIDER,
      useExisting: OpenAiProvider,
    },
    {
      provide: EMBEDDING_PROVIDER,
      useExisting: OpenAiProvider,
    },
  ],
  exports: [AI_CHAT_PROVIDER, EMBEDDING_PROVIDER],
})
export class AiModule {}
