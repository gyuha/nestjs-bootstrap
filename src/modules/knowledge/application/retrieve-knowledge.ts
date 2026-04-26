import { Inject, Injectable, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EMBEDDING_PROVIDER } from "../../ai/domain/embedding.provider";
import type { EmbeddingProvider } from "../../ai/domain/embedding.provider";
import { KNOWLEDGE_REPOSITORY } from "../domain/knowledge.repository";
import type { KnowledgeRepository, KnowledgeSearchResult } from "../domain/knowledge.repository";
import { KNOWLEDGE_SOURCE_PROVIDERS } from "../domain/knowledge-source.provider";
import type { KnowledgeSourceProvider } from "../domain/knowledge-source.provider";

export type RetrieveKnowledgeInput = {
  question: string;
};

export type RetrieveKnowledgeOptions = {
  topK: number;
  minScore: number;
};

export type RetrieveKnowledgeResult = {
  results: KnowledgeSearchResult[];
  lowConfidence: boolean;
};

@Injectable()
export class RetrieveKnowledge {
  private readonly options: RetrieveKnowledgeOptions;

  constructor(
    @Inject(KNOWLEDGE_REPOSITORY)
    private readonly repository: KnowledgeRepository,
    @Inject(EMBEDDING_PROVIDER)
    private readonly embeddingProvider: EmbeddingProvider,
    @Optional()
    @Inject(KNOWLEDGE_SOURCE_PROVIDERS)
    private readonly sourceProviders: KnowledgeSourceProvider[] = [],
    optionsOrConfig?: RetrieveKnowledgeOptions | ConfigService,
  ) {
    this.options =
      optionsOrConfig instanceof ConfigService
        ? {
            topK: optionsOrConfig.getOrThrow<number>("rag.topK"),
            minScore: optionsOrConfig.getOrThrow<number>("rag.minScore"),
          }
        : (optionsOrConfig ?? { topK: 5, minScore: 0.72 });
  }

  async execute(input: RetrieveKnowledgeInput): Promise<RetrieveKnowledgeResult> {
    const embedding = await this.embeddingProvider.embed(input.question);
    const repositoryResults = await this.repository.searchChunksByEmbedding({
      embedding: embedding.embedding,
      topK: this.options.topK,
      minScore: this.options.minScore,
    });
    const providerResults = await Promise.all(
      this.sourceProviders.map((provider) =>
        provider.search({ question: input.question, topK: this.options.topK }),
      ),
    );
    const results = [...repositoryResults, ...providerResults.flat()]
      .filter((result) => result.score >= this.options.minScore)
      .sort((left, right) => right.score - left.score)
      .slice(0, this.options.topK);

    return {
      results,
      lowConfidence: results.length === 0,
    };
  }
}
