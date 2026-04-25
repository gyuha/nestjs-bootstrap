import type { IAIGatewayService } from "../../domain/services/iai-gateway.service";
import type { EmbedRequestDto } from "../dto/request/embed-request.dto";
export interface EmbedResultDto {
  embeddings: number[][];
  model: string;
}
export declare class EmbedUseCase {
  private readonly aiGateway;
  constructor(aiGateway: IAIGatewayService);
  execute(dto: EmbedRequestDto): Promise<EmbedResultDto>;
}
