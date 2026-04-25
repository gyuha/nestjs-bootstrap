import type { AIRequest } from '../entities/ai-request.entity';
import type { AIResponse } from '../entities/ai-response.entity';
export interface IAIGatewayService {
    chat(request: AIRequest): Promise<AIResponse>;
    embed(texts: string[]): Promise<number[][]>;
}
