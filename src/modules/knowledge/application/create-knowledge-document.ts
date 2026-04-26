import { Inject, Injectable } from "@nestjs/common";
import { KNOWLEDGE_REPOSITORY, type KnowledgeRepository } from "../domain/knowledge.repository";
import type { KnowledgeDocument, KnowledgeMetadata } from "../domain/knowledge.types";
import { IndexKnowledgeDocument } from "./index-knowledge-document";

export type CreateKnowledgeDocumentInput = {
  title: string;
  sourceKey: string;
  content: string;
  metadata?: KnowledgeMetadata;
  createdBy: string;
};

@Injectable()
export class CreateKnowledgeDocument {
  constructor(
    @Inject(KNOWLEDGE_REPOSITORY)
    private readonly repository: KnowledgeRepository,
    @Inject(IndexKnowledgeDocument)
    private readonly indexKnowledgeDocument: IndexKnowledgeDocument,
  ) {}

  async execute(input: CreateKnowledgeDocumentInput): Promise<KnowledgeDocument> {
    const document = await this.repository.createDocument({
      title: input.title,
      sourceType: "document",
      sourceKey: input.sourceKey,
      metadata: input.metadata,
      createdBy: input.createdBy,
    });

    await this.indexKnowledgeDocument.execute({
      documentId: document.id,
      content: input.content,
    });

    return this.repository.findDocument(document.id).then((updated) => updated ?? document);
  }
}
