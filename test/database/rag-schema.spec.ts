import { describe, expect, it } from "vitest";
import {
  chatMessages,
  chatMessageSources,
  chatSessions,
  knowledgeChunks,
  knowledgeDocuments,
  knowledgeSyncJobs,
} from "../../src/shared/infrastructure/database/schema";

describe("rag database schema", () => {
  it("exports knowledge and chat tables", () => {
    expect(knowledgeDocuments).toBeDefined();
    expect(knowledgeChunks).toBeDefined();
    expect(knowledgeSyncJobs).toBeDefined();
    expect(chatSessions).toBeDefined();
    expect(chatMessages).toBeDefined();
    expect(chatMessageSources).toBeDefined();
  });
});
