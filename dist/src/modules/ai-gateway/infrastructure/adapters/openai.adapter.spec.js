"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const openai_adapter_1 = require("./openai.adapter");
const ai_request_entity_1 = require("../../domain/entities/ai-request.entity");
const mockChatCompletionsCreate = jest.fn();
const mockEmbeddingsCreate = jest.fn();
jest.mock('openai', () => {
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
describe('OpenAIAdapter', () => {
    let adapter;
    let config;
    const mockChatCompletion = {
        id: 'chatcmpl-123',
        choices: [
            {
                index: 0,
                message: {
                    role: 'assistant',
                    content: 'Hello, how can I help you?',
                },
                finish_reason: 'stop',
            },
        ],
        created: 1234567890,
        model: 'gpt-4o',
        object: 'chat.completion',
        usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
        },
    };
    const mockEmbeddingResponse = {
        data: [
            {
                embedding: [0.1, 0.2, 0.3],
                index: 0,
                object: 'embedding',
            },
            {
                embedding: [0.4, 0.5, 0.6],
                index: 1,
                object: 'embedding',
            },
        ],
        model: 'text-embedding-3-small',
        object: 'list',
        usage: {
            prompt_tokens: 8,
            completion_tokens: 0,
            total_tokens: 8,
        },
    };
    beforeEach(() => {
        config = {
            apiKey: 'test-api-key',
            organization: 'test-org',
            defaultModel: 'gpt-4o',
            timeoutMs: 30000,
        };
        adapter = new openai_adapter_1.OpenAIAdapter(config);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('chat', () => {
        it('should send chat request and return AIResponse', async () => {
            mockChatCompletionsCreate.mockResolvedValue(mockChatCompletion);
            const request = new ai_request_entity_1.AIRequest({
                id: 'req-1',
                messages: [
                    { role: 'user', content: 'Hello' },
                ],
                model: 'gpt-4o',
                temperature: 0.7,
                maxTokens: 100,
            });
            const response = await adapter.chat(request);
            expect(response).toBeDefined();
            expect(response.id).toBe('chatcmpl-123');
            expect(response.content).toBe('Hello, how can I help you?');
            expect(response.model).toBe('gpt-4o');
            expect(response.usage.promptTokens).toBe(10);
            expect(response.usage.completionTokens).toBe(20);
            expect(response.usage.totalTokens).toBe(30);
            expect(mockChatCompletionsCreate).toHaveBeenCalledWith(expect.objectContaining({
                model: 'gpt-4o',
                messages: [{ role: 'user', content: 'Hello' }],
                temperature: 0.7,
                max_tokens: 100,
            }));
        });
        it('should use default values when not provided in request', async () => {
            mockChatCompletionsCreate.mockResolvedValue(mockChatCompletion);
            const request = new ai_request_entity_1.AIRequest({
                id: 'req-1',
                messages: [{ role: 'user', content: 'Hello' }],
            });
            const response = await adapter.chat(request);
            expect(response).toBeDefined();
            expect(mockChatCompletionsCreate).toHaveBeenCalledWith(expect.objectContaining({
                model: 'gpt-4o',
                temperature: 0.7,
                max_tokens: 2048,
            }));
        });
        it('should handle undefined usage gracefully', async () => {
            const chatCompletionWithoutUsage = {
                id: 'chatcmpl-no-usage',
                choices: [
                    {
                        index: 0,
                        message: {
                            role: 'assistant',
                            content: 'Response without usage',
                        },
                        finish_reason: 'stop',
                    },
                ],
                created: 1234567890,
                model: 'gpt-4o',
                object: 'chat.completion',
                usage: undefined,
            };
            mockChatCompletionsCreate.mockResolvedValue(chatCompletionWithoutUsage);
            const request = new ai_request_entity_1.AIRequest({
                id: 'req-no-usage',
                messages: [{ role: 'user', content: 'Test' }],
            });
            const response = await adapter.chat(request);
            expect(response).toBeDefined();
            expect(response.usage.promptTokens).toBe(0);
            expect(response.usage.completionTokens).toBe(0);
            expect(response.usage.totalTokens).toBe(0);
        });
    });
    describe('embed', () => {
        it('should create embeddings and return array of vectors', async () => {
            mockEmbeddingsCreate.mockResolvedValue(mockEmbeddingResponse);
            const texts = ['Hello world', 'OpenAI is great'];
            const result = await adapter.embed(texts);
            expect(result).toEqual([[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]]);
            expect(mockEmbeddingsCreate).toHaveBeenCalledWith({
                model: 'text-embedding-3-small',
                input: texts,
            });
        });
    });
});
//# sourceMappingURL=openai.adapter.spec.js.map