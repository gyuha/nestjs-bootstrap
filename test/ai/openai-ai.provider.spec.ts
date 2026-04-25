import type { ConfigService } from "@nestjs/config";
import { describe, expect, it } from "vitest";
import { OpenAiProvider } from "../../src/modules/ai/infrastructure/openai-ai.provider";

describe("OpenAiProvider", () => {
  it("generates an answer with the configured model and system prompt", async () => {
    const client = new FakeOpenAiClient({
      responses: {
        output_text: "Use the billing portal to update your card.",
        usage: {
          input_tokens: 12,
          output_tokens: 9,
          total_tokens: 21,
        },
      },
    });
    const provider = new OpenAiProvider(createConfigService(), client);

    const result = await provider.generateAnswer({
      systemPrompt: "Answer as a concise support agent.",
      messages: [
        { role: "user", content: "How do I update my card?" },
        { role: "assistant", content: "You can do that from settings." },
        { role: "user", content: "Where exactly?" },
      ],
    });

    expect(client.responsesCreateCalls).toEqual([
      {
        model: "gpt-test-chat",
        instructions: "Answer as a concise support agent.",
        input: [
          { role: "user", content: "How do I update my card?" },
          { role: "assistant", content: "You can do that from settings." },
          { role: "user", content: "Where exactly?" },
        ],
      },
    ]);
    expect(result).toEqual({
      answer: "Use the billing portal to update your card.",
      usage: {
        inputTokens: 12,
        outputTokens: 9,
        totalTokens: 21,
      },
    });
  });

  it("embeds text with float encoding and the configured model", async () => {
    const client = new FakeOpenAiClient({
      embeddings: {
        data: [{ embedding: [0.1, 0.2, 0.3] }],
        usage: {
          prompt_tokens: 7,
          total_tokens: 7,
        },
      },
    });
    const provider = new OpenAiProvider(createConfigService(), client);

    const result = await provider.embed({ text: "Reset password instructions" });

    expect(client.embeddingsCreateCalls).toEqual([
      {
        model: "text-embedding-test",
        input: "Reset password instructions",
        encoding_format: "float",
      },
    ]);
    expect(result).toEqual({
      embedding: [0.1, 0.2, 0.3],
      usage: {
        promptTokens: 7,
        totalTokens: 7,
      },
    });
  });

  it("returns zero usage when OpenAI omits token usage", async () => {
    const client = new FakeOpenAiClient({
      responses: {
        output_text: "I can help with that.",
      },
      embeddings: {
        data: [{ embedding: [0.4, 0.5] }],
      },
    });
    const provider = new OpenAiProvider(createConfigService(), client);

    await expect(
      provider.generateAnswer({
        systemPrompt: "Help customers.",
        messages: [{ role: "user", content: "Hello" }],
      }),
    ).resolves.toEqual({
      answer: "I can help with that.",
      usage: {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
      },
    });
    await expect(provider.embed({ text: "Hello" })).resolves.toEqual({
      embedding: [0.4, 0.5],
      usage: {
        promptTokens: 0,
        totalTokens: 0,
      },
    });
  });
});

function createConfigService(): ConfigService {
  return {
    getOrThrow(key: string) {
      const values: Record<string, string> = {
        "ai.openAiApiKey": "sk-test",
        "ai.chatModel": "gpt-test-chat",
        "ai.embeddingModel": "text-embedding-test",
      };

      const value = values[key];
      if (!value) {
        throw new Error(`Missing config key: ${key}`);
      }

      return value;
    },
  } as ConfigService;
}

type FakeOpenAiResponsesResult = {
  output_text: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
};

type FakeOpenAiEmbeddingsResult = {
  data: Array<{ embedding: number[] }>;
  usage?: {
    prompt_tokens?: number;
    total_tokens?: number;
  };
};

class FakeOpenAiClient {
  readonly responsesCreateCalls: unknown[] = [];
  readonly embeddingsCreateCalls: unknown[] = [];

  readonly responses = {
    create: async (input: unknown) => {
      this.responsesCreateCalls.push(input);
      return this.results.responses;
    },
  };

  readonly embeddings = {
    create: async (input: unknown) => {
      this.embeddingsCreateCalls.push(input);
      return this.results.embeddings;
    },
  };

  constructor(
    private readonly results: {
      responses?: FakeOpenAiResponsesResult;
      embeddings?: FakeOpenAiEmbeddingsResult;
    },
  ) {}
}
