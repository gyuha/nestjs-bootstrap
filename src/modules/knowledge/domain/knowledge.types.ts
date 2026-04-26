export type KnowledgeDocumentStatus = "active" | "inactive" | "indexing" | "failed";
export type KnowledgeSourceType = "document" | "internal_db";
export type KnowledgeSyncJobStatus = "pending" | "running" | "succeeded" | "failed";

export type KnowledgeMetadata = Record<string, unknown>;

export type KnowledgeDocument = {
  id: string;
  title: string;
  sourceType: KnowledgeSourceType;
  sourceKey: string;
  status: KnowledgeDocumentStatus;
  metadata: KnowledgeMetadata;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type KnowledgeChunk = {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  metadata: KnowledgeMetadata;
  embedding: number[];
  createdAt: Date;
  updatedAt: Date;
};

export type KnowledgeSyncJob = {
  id: string;
  documentId: string | null;
  sourceType: KnowledgeSourceType;
  sourceKey: string;
  status: KnowledgeSyncJobStatus;
  errorMessage: string | null;
  metadata: KnowledgeMetadata;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
