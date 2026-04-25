"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatUseCase = void 0;
const common_1 = require("@nestjs/common");
const ai_request_entity_1 = require("../../domain/entities/ai-request.entity");
let ChatUseCase = class ChatUseCase {
    constructor(aiGateway, ragService) {
        this.aiGateway = aiGateway;
        this.ragService = ragService;
    }
    async execute(dto) {
        const messages = [
            { role: 'system', content: dto.systemPrompt ?? '' },
            { role: 'user', content: dto.message },
        ];
        let context = '';
        if (dto.useRag) {
            try {
                const searchResults = await this.ragService.search(dto.message, dto.topK ?? 5);
                if (searchResults.length > 0) {
                    context = searchResults
                        .map((r) => `[Source: ${r.documentId}] ${r.content}`)
                        .join('\n\n');
                    messages.unshift({ role: 'system', content: `Context:\n${context}` });
                }
            }
            catch (error) {
                console.error('RAG search failed:', error);
            }
        }
        const request = new ai_request_entity_1.AIRequest({
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
    extractProvider(model) {
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
};
exports.ChatUseCase = ChatUseCase;
exports.ChatUseCase = ChatUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object, Object])
], ChatUseCase);
//# sourceMappingURL=chat-use-case.js.map