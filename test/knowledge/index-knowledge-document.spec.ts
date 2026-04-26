import { describe, expect, it } from "vitest";
import { IndexKnowledgeDocument } from "../../src/modules/knowledge/application/index-knowledge-document";
import type {
  CreateKnowledgeChunkInput,
  CreateKnowledgeDocumentInput,
  CreateKnowledgeSyncJobInput,
  KnowledgeRepository,
} from "../../src/modules/knowledge/domain/knowledge.repository";
import { KnowledgeDocumentNotFoundError } from "../../src/modules/knowledge/domain/knowledge.repository";
import type {
  KnowledgeChunk,
  KnowledgeDocument,
  KnowledgeDocumentStatus,
  KnowledgeSyncJob,
} from "../../src/modules/knowledge/domain/knowledge.types";

describe("IndexKnowledgeDocument", () => {
  it("chunks, embeds, stores chunks, and marks the document active", async () => {
    const repository = new InMemoryKnowledgeRepository();
    const document = await repository.createDocument({
      title: "Refund Policy",
      sourceType: "document",
      sourceKey: "refund.md",
    });
    const useCase = new IndexKnowledgeDocument(repository, {
      embed: async (text) => ({
        embedding: text.includes("Refunds") ? [1, 0, 0] : [0, 1, 0],
        tokenUsage: { promptTokens: 1, totalTokens: 1 },
      }),
    });

    await useCase.execute({
      documentId: document.id,
      content: "Refunds are available within seven days.",
    });

    expect(repository.chunksFor(document.id)).toMatchObject([
      {
        chunkIndex: 0,
        content: "Refunds are available within seven days.",
        embedding: [1, 0, 0],
      },
    ]);
    expect((await repository.findDocument(document.id))?.status).toBe("active");
  });

  it("marks the document failed when embedding fails", async () => {
    const repository = new InMemoryKnowledgeRepository();
    const document = await repository.createDocument({
      title: "Broken Policy",
      sourceType: "document",
      sourceKey: "broken.md",
    });
    const useCase = new IndexKnowledgeDocument(repository, {
      embed: async () => {
        throw new Error("embedding unavailable");
      },
    });

    await expect(
      useCase.execute({
        documentId: document.id,
        content: "This should fail while embedding.",
      }),
    ).rejects.toThrow("embedding unavailable");
    expect((await repository.findDocument(document.id))?.status).toBe("failed");
  });
});

class InMemoryKnowledgeRepository implements KnowledgeRepository {
  private readonly documents = new Map<string, KnowledgeDocument>();
  private readonly chunks = new Map<string, KnowledgeChunk[]>();

  async createDocument(input: CreateKnowledgeDocumentInput): Promise<KnowledgeDocument> {
    const now = new Date();
    const document: KnowledgeDocument = {
      id: `document-${this.documents.size + 1}`,
      title: input.title,
      sourceType: input.sourceType,
      sourceKey: input.sourceKey,
      status: "indexing",
      metadata: input.metadata ?? {},
      createdBy: input.createdBy ?? null,
      createdAt: now,
      updatedAt: now,
    };

    this.documents.set(document.id, document);
    return document;
  }

  async findDocument(id: string): Promise<KnowledgeDocument | null> {
    return this.documents.get(id) ?? null;
  }

  async listDocuments(): Promise<never> {
    throw new Error("Not implemented");
  }

  async markDocumentStatus(
    id: string,
    status: KnowledgeDocumentStatus,
  ): Promise<KnowledgeDocument> {
    const document = this.documents.get(id);

    if (!document) {
      throw new KnowledgeDocumentNotFoundError(id);
    }

    const updated = { ...document, status, updatedAt: new Date() };
    this.documents.set(id, updated);
    return updated;
  }

  async replaceChunks(
    documentId: string,
    chunks: CreateKnowledgeChunkInput[],
  ): Promise<KnowledgeChunk[]> {
    if (!this.documents.has(documentId)) {
      throw new KnowledgeDocumentNotFoundError(documentId);
    }

    const now = new Date();
    const storedChunks = chunks.map((chunk, index) => ({
      id: `chunk-${index + 1}`,
      documentId,
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
      metadata: chunk.metadata ?? {},
      embedding: chunk.embedding,
      createdAt: now,
      updatedAt: now,
    }));

    this.chunks.set(documentId, storedChunks);
    return storedChunks;
  }

  async searchChunksByEmbedding(): Promise<never> {
    throw new Error("Not implemented");
  }

  async createSyncJob(_input: CreateKnowledgeSyncJobInput): Promise<KnowledgeSyncJob> {
    throw new Error("Not implemented");
  }

  async completeSyncJob(_id: string): Promise<KnowledgeSyncJob> {
    throw new Error("Not implemented");
  }

  async failSyncJob(_id: string, _errorMessage: string): Promise<KnowledgeSyncJob> {
    throw new Error("Not implemented");
  }

  chunksFor(documentId: string): KnowledgeChunk[] {
    return this.chunks.get(documentId) ?? [];
  }
}
