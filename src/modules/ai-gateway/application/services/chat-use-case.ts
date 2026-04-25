import { Injectable } from '@nestjs/common';
import { IAIGatewayService } from '../../domain/services/iai-gateway.service';
import { AIRequest } from '../../domain/entities/ai-request.entity';
import { ChatRequestDto } from '../dto/request/chat-request.dto';
import { ChatResponseDto } from '../dto/response/chat-response.dto';
import { IRAGService, SearchResult } from '../../domain/services/irag.service';

@Injectable()
export class ChatUseCase {
  constructor(
    private readonly aiGateway: IAIGatewayService,
    private readonly ragService: IRAGService,
  ) {}

  async execute(dto: ChatRequestDto): Promise<ChatResponseDto> {
    const messages = [
      { role: 'system' as const, content: dto.systemPrompt ?? '' },
      { role: 'user' as const, content: dto.message },
    ];

    let context = '';
    if (dto.useRag) {
      const searchResults = await this.ragService.search(dto.message, dto.topK ?? 5);
      if (searchResults.length > 0) {
        context = searchResults
          .map((r: SearchResult) => `[Source: ${r.documentId}] ${r.content}`)
          .join('\n\n');
        messages.unshift({ role: 'system', content: `Context:\n${context}` });
      }
    }

    const request = new AIRequest({
      id: crypto.randomUUID(),
      messages,
      model: dto.model,
      temperature: dto.temperature,
      maxTokens: dto.maxTokens,
      sessionId: dto.sessionId,
      userId: dto.userId,
    });

    const response = await this.aiGateway.chat(request);

    return {
      response: response.content,
      sources: dto.useRag ? await this.ragService.getSources(dto.message) : [],
      usage: {
        promptTokens: response.usage.promptTokens,
        completionTokens: response.usage.completionTokens,
        totalTokens: response.usage.totalTokens,
      },
      model: response.model,
      latencyMs: response.latencyMs,
    };
  }
}