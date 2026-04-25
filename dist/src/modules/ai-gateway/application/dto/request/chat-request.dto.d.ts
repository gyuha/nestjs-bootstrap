export declare class ChatRequestDto {
    message: string;
    sessionId?: string;
    userId?: string;
    model?: string;
    systemPrompt?: string;
    useRag?: boolean;
    temperature?: number;
    maxTokens?: number;
    topK?: number;
}
