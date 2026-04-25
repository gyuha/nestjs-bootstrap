import type { IAIGatewayService } from "../../domain/services/iai-gateway.service";
import type { AIRequest } from "../../domain/entities/ai-request.entity";
import { AIResponse } from "../../domain/entities/ai-response.entity";
export interface OpenAIAdapterConfig {
  apiKey: string;
  organization?: string;
  defaultModel?: string;
  embeddingModel?: string;
  timeoutMs?: number;
}
export declare class OpenAIAdapter implements IAIGatewayService {
  private config;
  private client;
  constructor(config: OpenAIAdapterConfig);
  chat(request: AIRequest): Promise<AIResponse>;
  embed(texts: string[]): Promise<number[][]>;
}
