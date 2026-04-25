import type { ChatUseCase } from '../../application/services/chat-use-case';
import type { EmbedUseCase } from '../../application/services/embedding-use-case';
import type { ChatRequestDto } from '../../application/dto/request/chat-request.dto';
import type { EmbedRequestDto } from '../../application/dto/request/embed-request.dto';
export declare class AiGatewayController {
    private readonly chatUseCase;
    private readonly embedUseCase;
    constructor(chatUseCase: ChatUseCase, embedUseCase: EmbedUseCase);
    chat(dto: ChatRequestDto): Promise<import("../../application/dto/response/chat-response.dto").ChatResponseDto>;
    embed(dto: EmbedRequestDto): Promise<import("../../application/services/embedding-use-case").EmbedResultDto>;
    models(): Promise<{
        data: {
            id: string;
            provider: string;
            name: string;
        }[];
    }>;
}
