import type { IAIGatewayService } from "../../domain/services/iai-gateway.service";
import type { ChatRequestDto } from "../dto/request/chat-request.dto";
import type { ChatResponseDto } from "../dto/response/chat-response.dto";
import type { IRAGService } from "../../domain/services/irag.service";
export declare class ChatUseCase {
  private readonly aiGateway;
  private readonly ragService;
  constructor(aiGateway: IAIGatewayService, ragService: IRAGService);
  execute(dto: ChatRequestDto): Promise<ChatResponseDto>;
  private extractProvider;
}
