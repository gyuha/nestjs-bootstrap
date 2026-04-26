import type { PageResult } from "../../../shared/domain/pagination";
import type {
  KnowledgeChunk,
  KnowledgeDocument,
  KnowledgeDocumentStatus,
  KnowledgeMetadata,
  KnowledgeSourceType,
  KnowledgeSyncJob,
} from "./knowledge.types";

export const KNOWLEDGE_REPOSITORY = Symbol("KNOWLEDGE_REPOSITORY");

export class KnowledgeDocumentNotFoundError extends Error {
  constructor(id: string) {
    super(`Knowledge document not found: ${id}`);
    this.name = "KnowledgeDocumentNotFoundError";
  }
}

export class KnowledgeDocumentSourceAlreadyExistsError extends Error {
  constructor(sourceKey: string) {
    super(`Knowledge document source already exists: ${sourceKey}`);
    this.name = "KnowledgeDocumentSourceAlreadyExistsError";
  }
}

export class KnowledgeSyncJobNotFoundError extends Error {
  constructor(id: string) {
    super(`Knowledge sync job not found: ${id}`);
    this.name = "KnowledgeSyncJobNotFoundError";
  }
}

export type CreateKnowledgeDocumentInput = {
  title: string;
  sourceType: KnowledgeSourceType;
  sourceKey: string;
  metadata?: KnowledgeMetadata;
  createdBy?: string | null;
};

export type CreateKnowledgeChunkInput = {
  chunkIndex: number;
  content: string;
  metadata?: KnowledgeMetadata;
  embedding: number[];
};

export type CreateKnowledgeSyncJobInput = {
  documentId?: string | null;
  sourceType: KnowledgeSourceType;
  sourceKey: string;
  metadata?: KnowledgeMetadata;
};

export type KnowledgeSearchResult = {
  sourceType: KnowledgeSourceType;
  sourceKey: string;
  content: string;
  score: number;
  documentId?: string;
  chunkId?: string;
  title?: string;
  metadata?: KnowledgeMetadata;
};

export interface KnowledgeRepository {
  createDocument(input: CreateKnowledgeDocumentInput): Promise<KnowledgeDocument>;
  findDocument(id: string): Promise<KnowledgeDocument | null>;
  listDocuments(input: { page: number; limit: number }): Promise<PageResult<KnowledgeDocument>>;
  markDocumentStatus(id: string, status: KnowledgeDocumentStatus): Promise<KnowledgeDocument>;
  replaceChunks(documentId: string, chunks: CreateKnowledgeChunkInput[]): Promise<KnowledgeChunk[]>;
  replaceChunksAndActivate(documentId: string, chunks: CreateKnowledgeChunkInput[]): Promise<void>;
  searchChunksByEmbedding(input: {
    embedding: number[];
    topK: number;
    minScore: number;
  }): Promise<KnowledgeSearchResult[]>;
  createSyncJob(input: CreateKnowledgeSyncJobInput): Promise<KnowledgeSyncJob>;
  completeSyncJob(id: string): Promise<KnowledgeSyncJob>;
  failSyncJob(id: string, errorMessage: string): Promise<KnowledgeSyncJob>;
}
