export const AI_CHAT_PROVIDER = Symbol("AI_CHAT_PROVIDER");

export type AiChatMessageRole = "system" | "user" | "assistant";

export type AiChatMessage = {
  role: AiChatMessageRole;
  content: string;
};

export type AiChatUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type GenerateAnswerInput = {
  systemPrompt: string;
  messages: AiChatMessage[];
};

export type GenerateAnswerResult = {
  answer: string;
  usage: AiChatUsage;
};

export interface AiChatProvider {
  generateAnswer(input: GenerateAnswerInput): Promise<GenerateAnswerResult>;
}
