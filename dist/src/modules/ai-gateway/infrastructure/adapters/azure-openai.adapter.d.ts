import type { IAIGatewayService } from '../../domain/services/iai-gateway.service';
import type { AIRequest } from '../../domain/entities/ai-request.entity';
import { AIResponse } from '../../domain/entities/ai-response.entity';
export interface AzureOpenAIAdapterConfig {
    endpoint: string;
    apiKey: string;
    apiVersion?: string;
    deploymentName: string;
    model?: string;
}
export declare class AzureOpenAIAdapter implements IAIGatewayService {
    private config;
    private client;
    constructor(config: AzureOpenAIAdapterConfig);
    chat(request: AIRequest): Promise<AIResponse>;
    embed(texts: string[]): Promise<number[][]>;
}
