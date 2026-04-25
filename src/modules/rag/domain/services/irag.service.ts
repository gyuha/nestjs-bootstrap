import type { ChunkStrategy } from "../value-objects/chunk-strategy.vo";

export interface SearchResult {
  documentId: string;
  chunkId: string;
  content: string;
  score: number;
}

export interface IndexOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  chunkStrategy?: ChunkStrategy;
}

export interface IRAGService {
  search(query: string, topK?: number): Promise<SearchResult[]>;
  indexDocuments(source: string, options?: IndexOptions): Promise<void>;
  getSources(query: string): Promise<SearchResult[]>;
}
