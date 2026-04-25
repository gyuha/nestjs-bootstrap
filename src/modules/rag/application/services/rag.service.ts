import { Injectable, Inject } from '@nestjs/common';
import type { IRAGService, SearchResult, IndexOptions } from '../../domain/services/irag.service';
import { ChunkStrategy } from '../../domain/value-objects/chunk-strategy.vo';

export const VECTOR_STORE_SERVICE = 'VECTOR_STORE_SERVICE';
export const EMBEDDING_SERVICE = 'EMBEDDING_SERVICE';

export interface VectorStoreServiceInterface {
  similaritySearch(embedding: number[], topK: number): Promise<SearchResult[]>;
  upsert(documents: { id: string; content: string; embedding: number[]; metadata: Record<string, any> }[]): Promise<void>;
}

export interface EmbeddingServiceInterface {
  embed(texts: string[]): Promise<number[][]>;
}

@Injectable()
export class RAGService implements IRAGService {
  constructor(
    @Inject(VECTOR_STORE_SERVICE) private readonly vectorStore: VectorStoreServiceInterface,
    @Inject(EMBEDDING_SERVICE) private readonly embeddingService: EmbeddingServiceInterface,
  ) {}

  async search(query: string, topK: number = 5): Promise<SearchResult[]> {
    const queryEmbedding = await this.embeddingService.embed([query]);
    const results = await this.vectorStore.similaritySearch(queryEmbedding[0], topK);
    return results.map(r => ({
      documentId: r.documentId,
      chunkId: r.chunkId,
      content: r.content,
      score: r.score,
    }));
  }

  async indexDocuments(source: string, options?: IndexOptions): Promise<void> {
    // TODO: Implementation for indexing from various sources
    // Will use document connectors to fetch documents and chunk them
    const chunkSize = options?.chunkSize ?? 1000;
    const chunkOverlap = options?.chunkOverlap ?? 200;
    const chunkStrategy = options?.chunkStrategy ?? ChunkStrategy.PARAGRAPHS;

    // Placeholder for chunking logic
    console.log(`Indexing documents from ${source} with chunkSize=${chunkSize}, overlap=${chunkOverlap}, strategy=${chunkStrategy}`);
  }

  async getSources(query: string): Promise<SearchResult[]> {
    return this.search(query, 3);
  }
}
