import type { KnowledgeSourceType } from "../../knowledge/domain/knowledge.types";
import type { ChatMessage, ChatMessageRole, ChatMetadata, ChatSession } from "./chat.types";

export const CHAT_REPOSITORY = Symbol("CHAT_REPOSITORY");

export class ChatSessionNotFoundError extends Error {
  constructor(id: string) {
    super(`Chat session not found: ${id}`);
    this.name = "ChatSessionNotFoundError";
  }
}

export class ChatSessionClosedError extends Error {
  constructor(id: string) {
    super(`Chat session is closed: ${id}`);
    this.name = "ChatSessionClosedError";
  }
}

export class ChatMessageNotFoundError extends Error {
  constructor(id: string) {
    super(`Chat message not found: ${id}`);
    this.name = "ChatMessageNotFoundError";
  }
}

export type CreateChatSessionInput = {
  userId?: string | null;
  anonymousTokenHash?: string | null;
  metadata?: ChatMetadata;
};

export type CreateChatMessageInput = {
  sessionId: string;
  role: ChatMessageRole;
  content: string;
  model?: string | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  totalTokens?: number | null;
  handoffRequested?: boolean;
  handoffReason?: string | null;
  handoffStatus?: string | null;
  handoffRequestedAt?: Date | null;
  metadata?: ChatMetadata;
};

export type CreateChatMessageSourceInput = {
  sourceType: KnowledgeSourceType;
  documentId?: string | null;
  chunkId?: string | null;
  score?: number | null;
  excerpt?: string | null;
  metadata?: ChatMetadata;
};

export interface ChatRepository {
  createSession(input: CreateChatSessionInput): Promise<ChatSession>;
  findSession(id: string): Promise<ChatSession | null>;
  findSessionByAnonymousTokenHash(hash: string): Promise<ChatSession | null>;
  listRecentMessages(sessionId: string, limit: number): Promise<ChatMessage[]>;
  createMessage(input: CreateChatMessageInput): Promise<ChatMessage>;
  attachSources(messageId: string, sources: CreateChatMessageSourceInput[]): Promise<void>;
}
