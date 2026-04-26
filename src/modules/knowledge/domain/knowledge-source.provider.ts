import type { KnowledgeSearchResult } from "./knowledge.repository";

export const KNOWLEDGE_SOURCE_PROVIDERS = Symbol("KNOWLEDGE_SOURCE_PROVIDERS");

export interface KnowledgeSourceProvider {
  search(input: { question: string; topK: number }): Promise<KnowledgeSearchResult[]>;
}
