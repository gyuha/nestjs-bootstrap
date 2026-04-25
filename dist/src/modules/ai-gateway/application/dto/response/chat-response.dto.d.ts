export interface SourceDocument {
    documentId: string;
    content: string;
    score?: number;
}
export interface TokenUsageDto {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}
export interface ChatResponseDto {
    response: string;
    sources: SourceDocument[];
    usage: TokenUsageDto;
    model: string;
    provider: string;
    latencyMs: number;
}
