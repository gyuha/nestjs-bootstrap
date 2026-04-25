import type { IRAGService, SearchResult, IndexOptions } from "../../domain/services/irag.service";
export declare const VECTOR_STORE_SERVICE = "VECTOR_STORE_SERVICE";
export declare const EMBEDDING_SERVICE = "EMBEDDING_SERVICE";
export interface VectorStoreServiceInterface {
  similaritySearch(embedding: number[], topK: number): Promise<SearchResult[]>;
  upsert(
    documents: {
      id: string;
      content: string;
      embedding: number[];
      metadata: Record<string, any>;
    }[],
  ): Promise<void>;
}
export interface EmbeddingServiceInterface {
  embed(texts: string[]): Promise<number[][]>;
}
export declare class RAGService implements IRAGService {
  private readonly vectorStore;
  private readonly embeddingService;
  constructor(
    vectorStore: VectorStoreServiceInterface,
    embeddingService: EmbeddingServiceInterface,
  );
  search(query: string, topK?: number): Promise<SearchResult[]>;
  indexDocuments(source: string, options?: IndexOptions): Promise<void>;
  getSources(query: string): Promise<SearchResult[]>;
}
