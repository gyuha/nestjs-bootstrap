"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIAdapter = void 0;
const ai_response_entity_1 = require("../../domain/entities/ai-response.entity");
const token_usage_entity_1 = require("../../domain/entities/token-usage.entity");
const openai_1 = require("openai");
class OpenAIAdapter {
  constructor(config) {
    this.config = config;
    this.client = new openai_1.default({
      apiKey: config.apiKey,
      organization: config.organization,
      timeout: config.timeoutMs ?? 30000,
    });
  }
  async chat(request) {
    const response = await this.client.chat.completions.create({
      model: request.model ?? this.config.defaultModel,
      messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: request.temperature,
      max_tokens: request.maxTokens,
    });
    const choice = response.choices[0];
    const usage = response.usage;
    return new ai_response_entity_1.AIResponse({
      id: response.id,
      content: choice.message.content ?? "",
      usage: new token_usage_entity_1.TokenUsage({
        promptTokens: usage?.prompt_tokens ?? 0,
        completionTokens: usage?.completion_tokens ?? 0,
        totalTokens: usage?.total_tokens ?? 0,
      }),
      model: response.model,
      created: response.created,
    });
  }
  async embed(texts) {
    const response = await this.client.embeddings.create({
      model: this.config.embeddingModel ?? "text-embedding-3-small",
      input: texts,
    });
    return response.data.map((d) => d.embedding);
  }
}
exports.OpenAIAdapter = OpenAIAdapter;
//# sourceMappingURL=openai.adapter.js.map
