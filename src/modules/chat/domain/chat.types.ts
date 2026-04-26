import type { KnowledgeSourceType } from "../../knowledge/domain/knowledge.types";

export type ChatSessionStatus = "active" | "closed";
export type ChatMessageRole = "user" | "assistant" | "system";
export type ChatMetadata = Record<string, unknown>;

export type ChatSession = {
  id: string;
  userId: string | null;
  anonymousTokenHash: string | null;
  status: ChatSessionStatus;
  metadata: ChatMetadata;
  createdAt: Date;
  updatedAt: Date;
};

export type ChatMessage = {
  id: string;
  sessionId: string;
  role: ChatMessageRole;
  content: string;
  model: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  handoffRequested: boolean;
  handoffReason: string | null;
  handoffStatus: string | null;
  handoffRequestedAt: Date | null;
  metadata: ChatMetadata;
  createdAt: Date;
  updatedAt: Date;
};

export type ChatMessageSource = {
  id: string;
  assistantMessageId: string;
  sourceType: KnowledgeSourceType;
  documentId: string | null;
  chunkId: string | null;
  score: number | null;
  excerpt: string | null;
  metadata: ChatMetadata;
  createdAt: Date;
  updatedAt: Date;
};
