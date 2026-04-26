import type { ConfigService } from "@nestjs/config";
import OpenAI from "openai";
import type {
  AiChatProvider,
  AiChatUsage,
  GenerateAnswerInput,
  GenerateAnswerResult,
} from "../domain/ai-chat.provider";
import type {
  EmbeddingProvider,
  EmbeddingResult,
  EmbeddingUsage,
} from "../domain/embedding.provider";

export type OpenAiResponsesCreateInput = {
  model: string;
  instructions: string;
  input: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
};

export type OpenAiResponsesCreateResult = {
  output_text?: string | null;
  usage?: {
    input_tokens?: number | null;
    output_tokens?: number | null;
    total_tokens?: number | null;
  } | null;
};

export type OpenAiEmbeddingsCreateInput = {
  model: string;
  input: string;
  encoding_format: "float";
};

export type OpenAiEmbeddingsCreateResult = {
  data?: Array<{
    embedding?: number[];
  }>;
  usage?: {
    prompt_tokens?: number | null;
    total_tokens?: number | null;
  } | null;
};

export type OpenAiClient = {
  responses: {
    create(input: OpenAiResponsesCreateInput): Promise<OpenAiResponsesCreateResult>;
  };
  embeddings: {
    create(input: OpenAiEmbeddingsCreateInput): Promise<OpenAiEmbeddingsCreateResult>;
  };
};

export type OpenAiClientOptions = ConstructorParameters<typeof OpenAI>[0];

export class OpenAiProvider implements AiChatProvider, EmbeddingProvider {
  private readonly chatModel: string;
  private readonly embeddingModel: string;
  private readonly client: OpenAiClient;

  constructor(config: ConfigService, client?: OpenAiClient) {
    this.chatModel = config.getOrThrow<string>("ai.chatModel");
    this.embeddingModel = config.getOrThrow<string>("ai.embeddingModel");
    this.client = client ?? (new OpenAI(createOpenAiClientOptions(config)) as OpenAiClient);
  }

  async generateAnswer(input: GenerateAnswerInput): Promise<GenerateAnswerResult> {
    const response = await this.client.responses.create({
      model: this.chatModel,
      instructions: input.systemPrompt,
      input: input.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    });

    return {
      answer: response.output_text ?? "",
      tokenUsage: mapChatUsage(response.usage),
    };
  }

  async embed(input: string): Promise<EmbeddingResult> {
    const response = await this.client.embeddings.create({
      model: this.embeddingModel,
      input,
      encoding_format: "float",
    });

    return {
      embedding: response.data?.[0]?.embedding ?? [],
      tokenUsage: mapEmbeddingUsage(response.usage),
    };
  }
}

export function createOpenAiClientOptions(config: ConfigService): OpenAiClientOptions {
  return {
    apiKey: config.getOrThrow<string>("ai.openAiApiKey"),
    baseURL: config.getOrThrow<string>("ai.openAiBaseUrl"),
  };
}

function mapChatUsage(usage: OpenAiResponsesCreateResult["usage"]): AiChatUsage {
  return {
    inputTokens: usage?.input_tokens ?? 0,
    outputTokens: usage?.output_tokens ?? 0,
    totalTokens: usage?.total_tokens ?? 0,
  };
}

function mapEmbeddingUsage(usage: OpenAiEmbeddingsCreateResult["usage"]): EmbeddingUsage {
  return {
    promptTokens: usage?.prompt_tokens ?? 0,
    totalTokens: usage?.total_tokens ?? 0,
  };
}
