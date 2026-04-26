import { desc, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import {
  chatMessages,
  chatMessageSources,
  chatSessions,
  type schema,
} from "../../../shared/infrastructure/database/schema";
import type {
  ChatRepository,
  CreateChatMessageInput,
  CreateChatMessageSourceInput,
  CreateChatSessionInput,
} from "../domain/chat.repository";
import {
  ChatMessageNotFoundError,
  ChatMessageSourceTargetInvalidError,
  ChatSessionClosedError,
  ChatSessionNotFoundError,
} from "../domain/chat.repository";
import type { ChatMessage, ChatSession } from "../domain/chat.types";

type Database = NodePgDatabase<typeof schema>;
type ChatSessionRow = typeof chatSessions.$inferSelect;
type ChatMessageRow = typeof chatMessages.$inferSelect;

export class DrizzleChatRepository implements ChatRepository {
  constructor(private readonly db: Database) {}

  async createSession(input: CreateChatSessionInput): Promise<ChatSession> {
    const [row] = await this.db
      .insert(chatSessions)
      .values({
        userId: input.userId ?? null,
        anonymousTokenHash: input.anonymousTokenHash ?? null,
        metadata: input.metadata ?? {},
      })
      .returning();

    return this.toSessionDomain(row);
  }

  async findSession(id: string): Promise<ChatSession | null> {
    const [row] = await this.db.select().from(chatSessions).where(eq(chatSessions.id, id)).limit(1);

    return row ? this.toSessionDomain(row) : null;
  }

  async findSessionByAnonymousTokenHash(hash: string): Promise<ChatSession | null> {
    const [row] = await this.db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.anonymousTokenHash, hash))
      .limit(1);

    return row ? this.toSessionDomain(row) : null;
  }

  async listRecentMessages(sessionId: string, limit: number): Promise<ChatMessage[]> {
    if (limit <= 0) {
      return [];
    }

    const rows = await this.db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(desc(chatMessages.createdAt), desc(chatMessages.id))
      .limit(limit);

    return rows
      .map((row) => this.toMessageDomain(row))
      .sort((left, right) => {
        const createdAtDiff = left.createdAt.getTime() - right.createdAt.getTime();

        return createdAtDiff === 0 ? left.id.localeCompare(right.id) : createdAtDiff;
      });
  }

  async createMessage(input: CreateChatMessageInput): Promise<ChatMessage> {
    return this.db.transaction(async (tx) => {
      const [session] = await tx
        .select()
        .from(chatSessions)
        .where(eq(chatSessions.id, input.sessionId))
        .limit(1)
        .for("update");

      if (!session) {
        throw new ChatSessionNotFoundError(input.sessionId);
      }

      if (session.status === "closed") {
        throw new ChatSessionClosedError(input.sessionId);
      }

      const [row] = await tx
        .insert(chatMessages)
        .values({
          sessionId: input.sessionId,
          role: input.role,
          content: input.content,
          model: input.model ?? null,
          promptTokens: input.promptTokens ?? null,
          completionTokens: input.completionTokens ?? null,
          totalTokens: input.totalTokens ?? null,
          handoffRequested: input.handoffRequested ?? false,
          handoffReason: input.handoffReason ?? null,
          handoffStatus: input.handoffStatus ?? null,
          handoffRequestedAt: input.handoffRequestedAt ?? null,
          metadata: input.metadata ?? {},
        })
        .returning();

      return this.toMessageDomain(row);
    });
  }

  async attachSources(messageId: string, sources: CreateChatMessageSourceInput[]): Promise<void> {
    const [message] = await this.db
      .select({ id: chatMessages.id, role: chatMessages.role })
      .from(chatMessages)
      .where(eq(chatMessages.id, messageId))
      .limit(1);

    if (!message) {
      throw new ChatMessageNotFoundError(messageId);
    }

    if (message.role !== "assistant") {
      throw new ChatMessageSourceTargetInvalidError(messageId);
    }

    if (sources.length === 0) {
      return;
    }

    await this.db.insert(chatMessageSources).values(
      sources.map((source) => ({
        assistantMessageId: messageId,
        sourceType: source.sourceType,
        documentId: source.documentId ?? null,
        chunkId: source.chunkId ?? null,
        score: source.score ?? null,
        excerpt: source.excerpt ?? null,
        metadata: source.metadata ?? {},
      })),
    );
  }

  private toSessionDomain(row: ChatSessionRow): ChatSession {
    return {
      id: row.id,
      userId: row.userId,
      anonymousTokenHash: row.anonymousTokenHash,
      status: row.status,
      metadata: row.metadata,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toMessageDomain(row: ChatMessageRow): ChatMessage {
    return {
      id: row.id,
      sessionId: row.sessionId,
      role: row.role,
      content: row.content,
      model: row.model,
      promptTokens: row.promptTokens,
      completionTokens: row.completionTokens,
      totalTokens: row.totalTokens,
      handoffRequested: row.handoffRequested,
      handoffReason: row.handoffReason,
      handoffStatus: row.handoffStatus,
      handoffRequestedAt: row.handoffRequestedAt,
      metadata: row.metadata,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
