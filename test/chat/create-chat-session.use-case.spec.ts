import { afterEach, describe, expect, it, vi } from "vitest";
import { CreateChatSession } from "../../src/modules/chat/application/chat.use-cases";
import { SessionTokenService } from "../../src/modules/chat/application/session-token.service";
import type {
  ChatRepository,
  CreateChatMessageInput,
  CreateChatMessageSourceInput,
  CreateChatSessionInput,
} from "../../src/modules/chat/domain/chat.repository";
import type { ChatMessage, ChatSession } from "../../src/modules/chat/domain/chat.types";

describe("CreateChatSession", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("stores an expiry for anonymous sessions using the configured ttl", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    const repository = new CapturingChatRepository();
    const useCase = new CreateChatSession(repository, new SessionTokenService(), {
      anonymousSessionTtl: "2h",
    });

    const result = await useCase.execute();

    expect(result.sessionToken).toEqual(expect.any(String));
    expect(repository.sessions[0]).toMatchObject({
      userId: null,
      anonymousTokenHash: expect.any(String),
      anonymousTokenExpiresAt: new Date("2026-01-01T02:00:00.000Z"),
    });
  });

  it("keeps authenticated sessions without anonymous token expiry", async () => {
    const repository = new CapturingChatRepository();
    const useCase = new CreateChatSession(repository, new SessionTokenService(), {
      anonymousSessionTtl: "2h",
    });

    const result = await useCase.execute({ userId: "user-1" });

    expect(result.sessionToken).toBeUndefined();
    expect(repository.sessions[0]).toMatchObject({
      userId: "user-1",
      anonymousTokenHash: null,
      anonymousTokenExpiresAt: null,
    });
  });
});

class CapturingChatRepository implements ChatRepository {
  readonly sessions: ChatSession[] = [];

  async createSession(input: CreateChatSessionInput): Promise<ChatSession> {
    const now = new Date();
    const session: ChatSession = {
      id: `session-${this.sessions.length + 1}`,
      userId: input.userId ?? null,
      anonymousTokenHash: input.anonymousTokenHash ?? null,
      anonymousTokenExpiresAt: input.anonymousTokenExpiresAt ?? null,
      status: "active",
      metadata: input.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    };

    this.sessions.push(session);

    return session;
  }

  async findSession(): Promise<ChatSession | null> {
    throw new Error("not used");
  }

  async findSessionByAnonymousTokenHash(): Promise<ChatSession | null> {
    throw new Error("not used");
  }

  async listRecentMessages(): Promise<ChatMessage[]> {
    throw new Error("not used");
  }

  async createMessage(_input: CreateChatMessageInput): Promise<ChatMessage> {
    throw new Error("not used");
  }

  async attachSources(_messageId: string, _sources: CreateChatMessageSourceInput[]): Promise<void> {
    throw new Error("not used");
  }
}
