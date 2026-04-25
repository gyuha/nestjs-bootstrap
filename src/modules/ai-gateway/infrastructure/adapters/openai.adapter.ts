import { IAIGatewayService } from '../../domain/services/iai-gateway.service';
import { AIRequest } from '../../domain/entities/ai-request.entity';
import { AIResponse } from '../../domain/entities/ai-response.entity';
import { TokenUsage } from '../../domain/entities/token-usage.entity';
import OpenAI from 'openai';

export interface OpenAIAdapterConfig {
  apiKey: string;
  organization?: string;
  defaultModel?: string;
  timeoutMs?: number;
}

export class OpenAIAdapter implements IAIGatewayService {
  private client: OpenAI;

  constructor(private config: OpenAIAdapterConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      organization: config.organization,
      timeout: config.timeoutMs ?? 30000,
    });
  }

  async chat(request: AIRequest): Promise<AIResponse> {
    const response = await this.client.chat.completions.create({
      model: request.model,
      messages: request.messages.map(m => ({ role: m.role, content: m.content })),
      temperature: request.temperature,
      max_tokens: request.maxTokens,
    });

    const choice = response.choices[0];
    const usage = response.usage;

    return new AIResponse({
      id: response.id,
      content: choice.message.content ?? '',
      usage: new TokenUsage({
        promptTokens: usage?.prompt_tokens ?? 0,
        completionTokens: usage?.completion_tokens ?? 0,
        totalTokens: usage?.total_tokens ?? 0,
      }),
      model: response.model,
      created: response.created,
    });
  }

  async embed(texts: string[]): Promise<number[][]> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
    });
    return response.data.map(d => d.embedding);
  }
}