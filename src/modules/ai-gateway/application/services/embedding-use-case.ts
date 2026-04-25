import { Injectable } from '@nestjs/common';
import type { IAIGatewayService } from '../../domain/services/iai-gateway.service';
import type { EmbedRequestDto } from '../dto/request/embed-request.dto';

export interface EmbedResultDto {
  embeddings: number[][];
  model: string;
}

@Injectable()
export class EmbedUseCase {
  constructor(private readonly aiGateway: IAIGatewayService) {}

  async execute(dto: EmbedRequestDto): Promise<EmbedResultDto> {
    const embeddings = await this.aiGateway.embed(dto.texts);
    return {
      embeddings,
      model: 'text-embedding-3-small',
    };
  }
}