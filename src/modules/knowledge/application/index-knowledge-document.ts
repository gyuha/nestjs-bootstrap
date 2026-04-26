import { Inject, Injectable } from "@nestjs/common";
import type { EmbeddingProvider } from "../../ai/domain/embedding.provider";
import { EMBEDDING_PROVIDER } from "../../ai/domain/embedding.provider";
import type { KnowledgeRepository } from "../domain/knowledge.repository";
import {
  KNOWLEDGE_REPOSITORY,
  KnowledgeDocumentNotFoundError,
} from "../domain/knowledge.repository";
import { chunkText } from "./chunk-text";

const defaultChunkingOptions = {
  maxWords: 200,
  overlapWords: 40,
};

export type IndexKnowledgeDocumentInput = {
  documentId: string;
  content: string;
};

@Injectable()
export class IndexKnowledgeDocument {
  constructor(
    @Inject(KNOWLEDGE_REPOSITORY)
    private readonly repository: KnowledgeRepository,
    @Inject(EMBEDDING_PROVIDER)
    private readonly embeddingProvider: EmbeddingProvider,
  ) {}

  async execute(input: IndexKnowledgeDocumentInput): Promise<void> {
    const document = await this.repository.findDocument(input.documentId);

    if (!document) {
      throw new KnowledgeDocumentNotFoundError(input.documentId);
    }

    try {
      const textChunks = chunkText(input.content, defaultChunkingOptions);
      const chunks = [];

      for (const chunk of textChunks) {
        const result = await this.embeddingProvider.embed(chunk.content);
        chunks.push({
          chunkIndex: chunk.chunkIndex,
          content: chunk.content,
          embedding: result.embedding,
        });
      }

      await this.repository.replaceChunksAndActivate(input.documentId, chunks);
    } catch (error) {
      await this.repository.markDocumentStatus(input.documentId, "failed");
      throw error;
    }
  }
}
