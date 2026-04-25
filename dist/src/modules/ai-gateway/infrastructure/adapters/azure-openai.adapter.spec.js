"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const azure_openai_adapter_1 = require("./azure-openai.adapter");
const ai_request_entity_1 = require("../../domain/entities/ai-request.entity");
const mockChatCompletionsCreate = jest.fn();
const mockEmbeddingsCreate = jest.fn();
jest.mock("openai", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockChatCompletionsCreate,
        },
      },
      embeddings: {
        create: mockEmbeddingsCreate,
      },
    })),
  };
});
describe("AzureOpenAIAdapter", () => {
  let adapter;
  let config;
  const mockChatCompletion = {
    id: "chatcmpl-azure-123",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: "Azure response",
        },
        finish_reason: "stop",
      },
    ],
    created: 1234567890,
    model: "azure-gpt-4o",
    object: "chat.completion",
    usage: {
      prompt_tokens: 15,
      completion_tokens: 25,
      total_tokens: 40,
    },
  };
  const mockEmbeddingResponse = {
    data: [
      {
        embedding: [0.7, 0.8, 0.9],
        index: 0,
        object: "embedding",
      },
    ],
    model: "azure-embedding",
    object: "list",
    usage: {
      prompt_tokens: 5,
      completion_tokens: 0,
      total_tokens: 5,
    },
  };
  beforeEach(() => {
    config = {
      endpoint: "https://example.openai.azure.com",
      apiKey: "azure-api-key",
      apiVersion: "2024-02-01",
      deploymentName: "azure-gpt-4o",
    };
    adapter = new azure_openai_adapter_1.AzureOpenAIAdapter(config);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe("chat", () => {
    it("should send chat request to Azure OpenAI and return AIResponse", async () => {
      mockChatCompletionsCreate.mockResolvedValue(mockChatCompletion);
      const request = new ai_request_entity_1.AIRequest({
        id: "req-azure-1",
        messages: [{ role: "user", content: "Hello Azure" }],
        temperature: 0.5,
        maxTokens: 500,
      });
      const response = await adapter.chat(request);
      expect(response).toBeDefined();
      expect(response.id).toBe("chatcmpl-azure-123");
      expect(response.content).toBe("Azure response");
      expect(response.model).toBe("azure-gpt-4o");
      expect(response.usage.promptTokens).toBe(15);
      expect(response.usage.completionTokens).toBe(25);
      expect(response.usage.totalTokens).toBe(40);
      expect(mockChatCompletionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "azure-gpt-4o",
          messages: [{ role: "user", content: "Hello Azure" }],
          temperature: 0.5,
          max_tokens: 500,
        }),
      );
    });
    it("should handle missing usage gracefully", async () => {
      const chatCompletionWithoutUsage = {
        id: "chatcmpl-no-usage",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "Response without usage",
            },
            finish_reason: "stop",
          },
        ],
        created: 1234567890,
        model: "azure-gpt-4o",
        object: "chat.completion",
        usage: undefined,
      };
      mockChatCompletionsCreate.mockResolvedValue(chatCompletionWithoutUsage);
      const request = new ai_request_entity_1.AIRequest({
        id: "req-no-usage",
        messages: [{ role: "user", content: "Test" }],
      });
      const response = await adapter.chat(request);
      expect(response).toBeDefined();
      expect(response.usage.promptTokens).toBe(0);
      expect(response.usage.completionTokens).toBe(0);
      expect(response.usage.totalTokens).toBe(0);
    });
  });
  describe("embed", () => {
    it("should create embeddings using Azure OpenAI", async () => {
      mockEmbeddingsCreate.mockResolvedValue(mockEmbeddingResponse);
      const texts = ["Azure embedding test"];
      const result = await adapter.embed(texts);
      expect(result).toEqual([[0.7, 0.8, 0.9]]);
      expect(mockEmbeddingsCreate).toHaveBeenCalledWith({
        model: "azure-gpt-4o",
        input: texts,
      });
    });
  });
});
//# sourceMappingURL=azure-openai.adapter.spec.js.map
