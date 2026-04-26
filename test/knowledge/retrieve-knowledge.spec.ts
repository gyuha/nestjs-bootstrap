import { describe, expect, it } from "vitest";
import { RetrieveKnowledge } from "../../src/modules/knowledge/application/retrieve-knowledge";
import type {
  CreateKnowledgeChunkInput,
  CreateKnowledgeDocumentInput,
  CreateKnowledgeSyncJobInput,
  KnowledgeRepository,
  KnowledgeSearchResult,
} from "../../src/modules/knowledge/domain/knowledge.repository";
import type {
  KnowledgeDocument,
  KnowledgeDocumentStatus,
  KnowledgeSyncJob,
} from "../../src/modules/knowledge/domain/knowledge.types";
import type { KnowledgeSourceProvider } from "../../src/modules/knowledge/domain/knowledge-source.provider";

describe("RetrieveKnowledge", () => {
  it("returns handoff-worthy empty results when all scores are below threshold", async () => {
    const retriever = new RetrieveKnowledge(
      fakeRepositoryWithScores([
        {
          sourceType: "document",
          sourceKey: "shipping.md",
          content: "Shipping only",
          score: 0.2,
        },
      ]),
      {
        embed: async () => ({
          embedding: [1, 0, 0],
          tokenUsage: { promptTokens: 1, totalTokens: 1 },
        }),
      },
      [],
      { topK: 5, minScore: 0.72 },
    );

    await expect(retriever.execute({ question: "Refund?" })).resolves.toMatchObject({
      results: [],
      lowConfidence: true,
    });
  });

  it("returns repository and source provider results above the threshold ordered by score", async () => {
    const sourceProvider: KnowledgeSourceProvider = {
      search: async () => [
        {
          sourceType: "internal_db",
          sourceKey: "support-article-7",
          content: "Refund escalation procedure",
          score: 0.91,
          metadata: { table: "support_articles" },
        },
      ],
    };
    const retriever = new RetrieveKnowledge(
      fakeRepositoryWithScores([
        {
          documentId: "doc-1",
          chunkId: "chunk-1",
          sourceType: "document",
          sourceKey: "refund.md",
          title: "Refund Policy",
          content: "Refunds are available within seven days.",
          score: 0.82,
        },
      ]),
      {
        embed: async () => ({
          embedding: [1, 0, 0],
          tokenUsage: { promptTokens: 1, totalTokens: 1 },
        }),
      },
      [sourceProvider],
      { topK: 5, minScore: 0.72 },
    );

    await expect(retriever.execute({ question: "Refund?" })).resolves.toMatchObject({
      lowConfidence: false,
      results: [
        { sourceType: "internal_db", sourceKey: "support-article-7", score: 0.91 },
        { sourceType: "document", sourceKey: "refund.md", score: 0.82 },
      ],
    });
  });
});

function fakeRepositoryWithScores(results: KnowledgeSearchResult[]): KnowledgeRepository {
  return {
    createDocument: async (_input: CreateKnowledgeDocumentInput) => {
      throw new Error("Not implemented");
    },
    findDocument: async (_id: string) => null,
    listDocuments: async () => {
      throw new Error("Not implemented");
    },
    markDocumentStatus: async (
      _id: string,
      _status: KnowledgeDocumentStatus,
    ): Promise<KnowledgeDocument> => {
      throw new Error("Not implemented");
    },
    replaceChunks: async (_documentId: string, _chunks: CreateKnowledgeChunkInput[]) => {
      throw new Error("Not implemented");
    },
    replaceChunksAndActivate: async (_documentId: string, _chunks: CreateKnowledgeChunkInput[]) => {
      throw new Error("Not implemented");
    },
    searchChunksByEmbedding: async (input) =>
      results.filter((result) => result.score >= input.minScore).slice(0, input.topK),
    createSyncJob: async (_input: CreateKnowledgeSyncJobInput): Promise<KnowledgeSyncJob> => {
      throw new Error("Not implemented");
    },
    completeSyncJob: async (_id: string): Promise<KnowledgeSyncJob> => {
      throw new Error("Not implemented");
    },
    failSyncJob: async (_id: string, _errorMessage: string): Promise<KnowledgeSyncJob> => {
      throw new Error("Not implemented");
    },
  };
}
