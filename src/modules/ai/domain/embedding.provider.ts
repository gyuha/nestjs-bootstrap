export const EMBEDDING_PROVIDER = Symbol("EMBEDDING_PROVIDER");

export type EmbeddingUsage = {
  promptTokens: number;
  totalTokens: number;
};

export type EmbedInput = {
  text: string;
};

export type EmbeddingResult = {
  embedding: number[];
  usage: EmbeddingUsage;
};

export interface EmbeddingProvider {
  embed(input: EmbedInput): Promise<EmbeddingResult>;
}
