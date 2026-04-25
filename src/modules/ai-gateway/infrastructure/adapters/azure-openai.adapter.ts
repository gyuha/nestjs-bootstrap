import type { IAIGatewayService } from "../../domain/services/iai-gateway.service";
import type { AIRequest } from "../../domain/entities/ai-request.entity";
import { AIResponse } from "../../domain/entities/ai-response.entity";
import { TokenUsage } from "../../domain/entities/token-usage.entity";
import OpenAI from "openai";

export interface AzureOpenAIAdapterConfig {
  endpoint: string;
  apiKey: string;
  apiVersion?: string;
  deploymentName: string;
  model?: string;
}

export class AzureOpenAIAdapter implements IAIGatewayService {
  private client: OpenAI;

  constructor(private config: AzureOpenAIAdapterConfig) {
    this.client = new OpenAI({
      baseURL: `${config.endpoint}/openai/deployments/${config.deploymentName}`,
      apiKey: config.apiKey,
      defaultQuery: { "api-version": config.apiVersion ?? "2024-02-01" },
    });
  }

  async chat(request: AIRequest): Promise<AIResponse> {
    const response = await this.client.chat.completions.create({
      model: this.config.model ?? this.config.deploymentName,
      messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: request.temperature,
      max_tokens: request.maxTokens,
    });

    const choice = response.choices[0];
    const usage = response.usage;

    return new AIResponse({
      id: response.id,
      content: choice.message.content ?? "",
      usage: new TokenUsage({
        promptTokens: usage?.prompt_tokens ?? 0,
        completionTokens: usage?.completion_tokens ?? 0,
        totalTokens: usage?.total_tokens ?? 0,
      }),
      model: this.config.deploymentName,
      created: response.created,
    });
  }

  async embed(texts: string[]): Promise<number[][]> {
    const response = await this.client.embeddings.create({
      model: this.config.model ?? this.config.deploymentName,
      input: texts,
    });
    return response.data.map((d) => d.embedding);
  }
}
