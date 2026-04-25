import { Injectable, Inject } from '@nestjs/common';
import type { IAIGatewayService } from '../../domain/services/iai-gateway.service';
import { AI_GATEWAY_SERVICE } from '../../domain/services/ai-gateway-service.token';
import { AIRequest } from '../../domain/entities/ai-request.entity';
import type { ChatRequestDto } from '../dto/request/chat-request.dto';
import type { ChatResponseDto } from '../dto/response/chat-response.dto';
import type { IRAGService, SearchResult } from '../../domain/services/irag.service';

@Injectable()
export class ChatUseCase {
  constructor(
    @Inject(AI_GATEWAY_SERVICE) private readonly aiGateway: IAIGatewayService,
    private readonly ragService: IRAGService,
  ) {}

  async execute(dto: ChatRequestDto): Promise<ChatResponseDto> {
    const messages = [
      { role: 'system' as const, content: dto.systemPrompt ?? '' },
      { role: 'user' as const, content: dto.message },
    ];

    let context = '';
    if (dto.useRag) {
      try {
        const searchResults = await this.ragService.search(dto.message, dto.topK ?? 5);
        if (searchResults.length > 0) {
          context = searchResults
            .map((r: SearchResult) => `[Source: ${r.documentId}] ${r.content}`)
            .join('\n\n');
          messages.unshift({ role: 'system', content: `Context:\n${context}` });
        }
      } catch (error) {
        // Log error but continue without RAG
        console.error('RAG search failed:', error);
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
      provider: this.extractProvider(response.model),
      latencyMs: response.latencyMs,
    };
  }

  private extractProvider(model: string): string {
    const modelLower = model.toLowerCase();
    if (modelLower.startsWith('gpt-') || modelLower.startsWith('o1') || modelLower.startsWith('o3')) {
      return 'openai';
    }
    if (modelLower.startsWith('claude-')) {
      return 'anthropic';
    }
    if (modelLower.startsWith('gemini-') || modelLower.startsWith('gemma-')) {
      return 'google';
    }
    if (modelLower.startsWith('mistral-')) {
      return 'mistral';
    }
    if (modelLower.startsWith('meta-') || modelLower.startsWith('llama-')) {
      return 'meta';
    }
    return 'unknown';
  }
}