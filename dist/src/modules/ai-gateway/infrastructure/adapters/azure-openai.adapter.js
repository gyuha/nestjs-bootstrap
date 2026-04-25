"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureOpenAIAdapter = void 0;
const ai_response_entity_1 = require("../../domain/entities/ai-response.entity");
const token_usage_entity_1 = require("../../domain/entities/token-usage.entity");
const openai_1 = require("openai");
class AzureOpenAIAdapter {
    constructor(config) {
        this.config = config;
        this.client = new openai_1.default({
            baseURL: `${config.endpoint}/openai/deployments/${config.deploymentName}`,
            apiKey: config.apiKey,
            defaultQuery: { 'api-version': config.apiVersion ?? '2024-02-01' },
        });
    }
    async chat(request) {
        const response = await this.client.chat.completions.create({
            model: this.config.model ?? this.config.deploymentName,
            messages: request.messages.map(m => ({ role: m.role, content: m.content })),
            temperature: request.temperature,
            max_tokens: request.maxTokens,
        });
        const choice = response.choices[0];
        const usage = response.usage;
        return new ai_response_entity_1.AIResponse({
            id: response.id,
            content: choice.message.content ?? '',
            usage: new token_usage_entity_1.TokenUsage({
                promptTokens: usage?.prompt_tokens ?? 0,
                completionTokens: usage?.completion_tokens ?? 0,
                totalTokens: usage?.total_tokens ?? 0,
            }),
            model: this.config.deploymentName,
            created: response.created,
        });
    }
    async embed(texts) {
        const response = await this.client.embeddings.create({
            model: this.config.model ?? this.config.deploymentName,
            input: texts,
        });
        return response.data.map(d => d.embedding);
    }
}
exports.AzureOpenAIAdapter = AzureOpenAIAdapter;
//# sourceMappingURL=azure-openai.adapter.js.map