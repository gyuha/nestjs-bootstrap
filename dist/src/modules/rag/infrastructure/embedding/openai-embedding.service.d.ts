import type { IAIGatewayService } from "../../../ai-gateway/domain/services/iai-gateway.service";
import type { EmbeddingServiceInterface } from "../../application/services/rag.service";
export declare const EMBEDDING_SERVICE = "EMBEDDING_SERVICE";
export declare class OpenAIEmbeddingService implements EmbeddingServiceInterface {
  private readonly aiGateway;
  constructor(aiGateway: IAIGatewayService);
  embed(texts: string[]): Promise<number[][]>;
}
