export const EMBEDDING_PROVIDER = Symbol("EMBEDDING_PROVIDER");

export type EmbeddingUsage = {
  promptTokens: number;
  totalTokens: number;
};

export type EmbeddingResult = {
  embedding: number[];
  tokenUsage: EmbeddingUsage;
};

export interface EmbeddingProvider {
  embed(input: string): Promise<EmbeddingResult>;
}
