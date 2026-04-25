import type { DrizzleService } from "../../../../infrastructure/database/drizzle.service";
import type { VectorStoreServiceInterface } from "../../../rag/application/services/rag.service";
import type { SearchResult } from "../../../rag/domain/services/irag.service";
export declare const VECTOR_STORE_SERVICE = "VECTOR_STORE_SERVICE";
interface ChunkMetadata {
  documentId: string;
  source: string;
  sourcePath?: string;
  chunkIndex: number;
  totalChunks: number;
}
interface UpsertDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata: ChunkMetadata;
}
export declare class PgVectorStoreService implements VectorStoreServiceInterface {
  private readonly db;
  constructor(db: DrizzleService);
  similaritySearch(queryEmbedding: number[], topK: number): Promise<SearchResult[]>;
  upsert(documents: UpsertDocument[]): Promise<void>;
}
export {};
