import { Injectable } from '@nestjs/common';
import type { IAIGatewayService } from '../../../ai-gateway/domain/services/iai-gateway.service';
import type { EmbeddingServiceInterface } from '../../application/services/rag.service';

export const EMBEDDING_SERVICE = 'EMBEDDING_SERVICE';

@Injectable()
export class OpenAIEmbeddingService implements EmbeddingServiceInterface {
  constructor(private readonly aiGateway: IAIGatewayService) {}

  async embed(texts: string[]): Promise<number[][]> {
    return this.aiGateway.embed(texts);
  }
}
