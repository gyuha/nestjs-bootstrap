import type { KnowledgeSearchResult } from "../../knowledge/domain/knowledge.repository";
import type { ChatMessage, ChatMetadata, ChatSession } from "../domain/chat.types";

export type ChatSessionResponse = {
  id: string;
  userId: string | null;
  status: string;
  metadata: ChatMetadata;
  sessionToken?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ChatMessageResponse = {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  handoffRequired: boolean;
  handoffReason: string | null;
  createdAt: Date;
};

export type ChatSourceResponse = {
  sourceType: KnowledgeSearchResult["sourceType"];
  sourceKey: string;
  documentId?: string;
  chunkId?: string;
  title?: string;
  score: number;
  excerpt: string;
  metadata: ChatMetadata;
};

export type ChatAnswerResponse = {
  messageId?: string;
  answer: string;
  handoffRequired: boolean;
  handoffReason: string | null;
  sources?: ChatSourceResponse[];
};

export function toChatSessionResponse(
  session: ChatSession,
  input: { sessionToken?: string } = {},
): ChatSessionResponse {
  return {
    id: session.id,
    userId: session.userId,
    status: session.status,
    metadata: session.metadata,
    ...(input.sessionToken ? { sessionToken: input.sessionToken } : {}),
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

export function toChatMessageResponse(message: ChatMessage): ChatMessageResponse {
  return {
    id: message.id,
    sessionId: message.sessionId,
    role: message.role,
    content: message.content,
    handoffRequired: message.handoffRequested,
    handoffReason: message.handoffReason,
    createdAt: message.createdAt,
  };
}

export function toChatSourceResponse(source: KnowledgeSearchResult): ChatSourceResponse {
  return {
    sourceType: source.sourceType,
    sourceKey: source.sourceKey,
    ...(source.documentId ? { documentId: source.documentId } : {}),
    ...(source.chunkId ? { chunkId: source.chunkId } : {}),
    ...(source.title ? { title: source.title } : {}),
    score: source.score,
    excerpt: source.content,
    metadata: source.metadata ?? {},
  };
}
