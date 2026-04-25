# AI Gateway + RAG + Monitoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a unified AI Gateway with RAG pipeline and API monitoring, supporting OpenAI-compatible providers, multiple document sources, and full observability.

**Architecture:** Layered DDD architecture with three new modules (ai-gateway, rag, monitoring). Gateway uses adapter pattern for provider abstraction. RAG pipeline uses existing PostgreSQL + pgvector for vector storage. All API calls are logged and metered via interceptors.

**Tech Stack:** NestJS 11, Drizzle ORM, PostgreSQL + pgvector, OpenAI SDK, ioredis (existing infra)

---

## File Structure

```
modules/ai-gateway/
├── domain/
│   ├── entities/
│   │   ├── ai-request.entity.ts
│   │   ├── ai-response.entity.ts
│   │   └── token-usage.entity.ts
│   ├── value-objects/
│   │   ├── provider-type.vo.ts
│   │   └── model-id.vo.ts
│   ├── repositories/
│   │   └── iai-model.repository.ts
│   └── services/
│       └── iai-gateway.service.ts
├── application/
│   ├── services/
│   │   ├── ai-gateway.service.ts
│   │   ├── chat-use-case.ts
│   │   └── embedding-use-case.ts
│   └── dto/
│       ├── request/
│       │   ├── chat-request.dto.ts
│       │   └── embed-request.dto.ts
│       └── response/
│           ├── chat-response.dto.ts
│           └── model-list-response.dto.ts
├── infrastructure/
│   ├── adapters/
│   │   ├── openai.adapter.ts
│   │   └── azure-openai.adapter.ts
│   └── services/
│       └── token-usage.service.ts
└── presentation/
    ├── controllers/
    │   └── ai-gateway.controller.ts
    ├── guards/
    │   └── api-key.guard.ts
    └── interceptors/
        └── token-usage.interceptor.ts

modules/rag/
├── domain/
│   ├── entities/
│   │   ├── document.entity.ts
│   │   ├── document-chunk.entity.ts
│   │   └── chunk-metadata.entity.ts
│   ├── value-objects/
│   │   └── chunk-strategy.vo.ts
│   └── services/
│       ├── irag.service.ts
│       └── idocument-connector.interface.ts
├── application/
│   ├── services/
│   │   └── rag.service.ts
│   ├── dto/
│   │   ├── index-request.dto.ts
│   │   └── search-result.dto.ts
│   └── connectors/
│       ├── file-system.connector.ts
│       └── database.connector.ts
└── infrastructure/
    ├── embedding/
    │   └── openai-embedding.service.ts
    └── vector-store/
        └── pg-vector-store.service.ts

modules/monitoring/
├── domain/
│   └── entities/
│       ├── api-log.entity.ts
│       ├── token-usage-log.entity.ts
│       └── metric-event.entity.ts
├── application/
│   ├── services/
│   │   ├── logging.service.ts
│   │   └── metrics.service.ts
│   └── dto/
│       └── metric-query.dto.ts
└── infrastructure/
    └── repositories/
        └── postgres-log.repository.ts

src/infrastructure/database/schema/
├── ai-api-logs.schema.ts          # NEW
└── ai-token-usage.schema.ts       # NEW
```

---

## Task 1: Database Schemas for AI Logging

**Files:**
- Create: `src/infrastructure/database/schema/ai-api-logs.schema.ts`
- Create: `src/infrastructure/database/schema/ai-token-usage.schema.ts`
- Modify: `src/infrastructure/database/schema/index.ts` (add exports)

- [ ] **Step 1: Create ai-api-logs schema**

```typescript
// src/infrastructure/database/schema/ai-api-logs.schema.ts
import { pgTable, uuid, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';

export const aiApiLogs = pgTable('ai_api_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  traceId: text('trace_id').notNull().unique(),
  sessionId: text('session_id'),
  userId: uuid('user_id'),
  
  // Request
  method: text('method').notNull(),
  path: text('path').notNull(),
  requestBody: jsonb('request_body'),
  
  // Response
  statusCode: integer('status_code').notNull(),
  responseBody: jsonb('response_body'),
  
  // Timing
  latencyMs: integer('latency_ms').notNull(),
  
  // Provider info
  provider: text('provider'),   // openai, azure-openai
  model: text('model'),
  
  // RAG info
  useRag: uuid('use_rag').notNull().default(false),
  ragHitRate: integer('rag_hit_rate'), // 0-100
  
  // Error
  errorCode: text('error_code'),
  errorMessage: text('error_message'),
  
  createdAt: timestamp('created_at').defaultNow(),
});

export type AiApiLog = typeof aiApiLogs.$inferSelect;
```

- [ ] **Step 2: Create ai-token-usage schema**

```typescript
// src/infrastructure/database/schema/ai-token-usage.schema.ts
import { pgTable, uuid, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const aiTokenUsage = pgTable('ai_token_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  traceId: text('trace_id').notNull().unique(),
  
  // User info
  userId: uuid('user_id'),
  
  // Token counts
  promptTokens: integer('prompt_tokens').notNull(),
  completionTokens: integer('completion_tokens').notNull(),
  totalTokens: integer('total_tokens').notNull(),
  
  // Cost tracking
  estimatedCostUsd: integer('estimated_cost_usd'), // cents
  
  // Provider
  provider: text('provider').notNull(),
  model: text('model').notNull(),
  
  createdAt: timestamp('created_at').defaultNow(),
});

export type AiTokenUsage = typeof aiTokenUsage.$inferSelect;
```

- [ ] **Step 3: Update schema index**

Add exports for the new schemas to `src/infrastructure/database/schema/index.ts`:
```typescript
export * from './ai-api-logs.schema';
export * from './ai-token-usage.schema';
```

- [ ] **Step 4: Commit**

```bash
git add src/infrastructure/database/schema/ai-api-logs.schema.ts src/infrastructure/database/schema/ai-token-usage.schema.ts src/infrastructure/database/schema/index.ts
git commit -m "feat(monitoring): add AI API logs and token usage schemas"
```

---

## Task 2: AI Gateway Domain Layer

**Files:**
- Create: `modules/ai-gateway/domain/entities/ai-request.entity.ts`
- Create: `modules/ai-gateway/domain/entities/ai-response.entity.ts`
- Create: `modules/ai-gateway/domain/entities/token-usage.entity.ts`
- Create: `modules/ai-gateway/domain/value-objects/provider-type.vo.ts`
- Create: `modules/ai-gateway/domain/value-objects/model-id.vo.ts`
- Create: `modules/ai-gateway/domain/repositories/iai-model.repository.ts`
- Create: `modules/ai-gateway/domain/services/iai-gateway.service.ts`

- [ ] **Step 1: Write tests for ProviderType value object**

```typescript
// modules/ai-gateway/domain/value-objects/provider-type.vo.ts
import { ValueObject } from '@src/shared/domain/value-objects/value-object';

export enum ProviderType {
  OPENAI = 'openai',
  AZURE_OPENAI = 'azure-openai',
}

export class ProviderTypeVO extends ValueObject<ProviderType> {
  readonly value: ProviderType;

  constructor(value: string) {
    if (!Object.values(ProviderType).includes(value as ProviderType)) {
      throw new Error(`Invalid provider type: ${value}`);
    }
    super();
    this.value = value as ProviderType;
  }
}
```

- [ ] **Step 2: Write ai-request.entity**

```typescript
// modules/ai-gateway/domain/entities/ai-request.entity.ts
import { AggregateRoot } from '@src/shared/domain/aggregate-root';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequestProps {
  id: string;
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  sessionId?: string;
  userId?: string;
}

export class AIRequest extends AggregateRoot<AIRequestProps> {
  get messages(): ChatMessage[] { return this.props.messages; }
  get model(): string { return this.props.model ?? 'gpt-4o'; }
  get temperature(): number { return this.props.temperature ?? 0.7; }
  get maxTokens(): number { return this.props.maxTokens ?? 2048; }
  get sessionId(): string | undefined { return this.props.sessionId; }
  get userId(): string | undefined { return this.props.userId; }
}
```

- [ ] **Step 3: Write token-usage.entity**

```typescript
// modules/ai-gateway/domain/entities/token-usage.entity.ts
import { Entity } from '@src/shared/domain/entity';

export interface TokenUsageProps {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd?: number;
}

export class TokenUsage extends Entity<TokenUsageProps> {
  get promptTokens(): number { return this.props.promptTokens; }
  get completionTokens(): number { return this.props.completionTokens; }
  get totalTokens(): number { return this.props.totalTokens; }
  get estimatedCostUsd(): number | undefined { return this.props.estimatedCostUsd; }
}
```

- [ ] **Step 4: Write iai-gateway.service interface**

```typescript
// modules/ai-gateway/domain/services/iai-gateway.service.ts
import { AIRequest } from '../entities/ai-request.entity';
import { AIResponse } from '../entities/ai-response.entity';
import { TokenUsage } from '../entities/token-usage.entity';

export interface IAIGatewayService {
  chat(request: AIRequest): Promise<AIResponse>;
  embed(texts: string[]): Promise<number[][]>;
}

export interface IAIModelRepository {
  findById(id: string): Promise<ModelDefinition | null>;
  findByProvider(provider: ProviderType): Promise<ModelDefinition[]>;
}
```

- [ ] **Step 5: Commit**

```bash
git add modules/ai-gateway/domain/...
git commit -m "feat(ai-gateway): add domain layer - entities, value objects, interfaces"
```

---

## Task 3: AI Gateway Infrastructure - OpenAI Adapter

**Files:**
- Create: `modules/ai-gateway/infrastructure/adapters/openai.adapter.ts`
- Create: `modules/ai-gateway/infrastructure/adapters/azure-openai.adapter.ts`

- [ ] **Step 1: Write OpenAI adapter test**

```typescript
// modules/ai-gateway/infrastructure/adapters/openai.adapter.spec.ts
import { OpenAIAdapter } from './openai.adapter';
import { AIRequest } from '../../domain/entities/ai-request.entity';

describe('OpenAIAdapter', () => {
  let adapter: OpenAIAdapter;
  
  beforeEach(() => {
    adapter = new OpenAIAdapter({ apiKey: 'test-key' });
  });

  describe('chat', () => {
    it('should return response with usage', async () => {
      // Mock OpenAI client
      const request = new AIRequest({
        id: 'req-1',
        messages: [{ role: 'user', content: 'Hello' }],
      });
      
      const response = await adapter.chat(request);
      
      expect(response.content).toBeDefined();
      expect(response.usage).toBeDefined();
    });
  });
});
```

- [ ] **Step 2: Implement OpenAI adapter**

```typescript
// modules/ai-gateway/infrastructure/adapters/openai.adapter.ts
import { IAIGatewayService } from '../../domain/services/iai-gateway.service';
import { AIRequest } from '../../domain/entities/ai-request.entity';
import { AIResponse } from '../../domain/entities/ai-response.entity';
import { TokenUsage } from '../../domain/entities/token-usage.entity';
import OpenAI from 'openai';

export interface OpenAIAdapterConfig {
  apiKey: string;
  organization?: string;
  defaultModel?: string;
  timeoutMs?: number;
}

export class OpenAIAdapter implements IAIGatewayService {
  private client: OpenAI;

  constructor(private config: OpenAIAdapterConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      organization: config.organization,
      timeout: config.timeoutMs ?? 30000,
    });
  }

  async chat(request: AIRequest): Promise<AIResponse> {
    const response = await this.client.chat.completions.create({
      model: request.model,
      messages: request.messages.map(m => ({ role: m.role, content: m.content })),
      temperature: request.temperature,
      max_tokens: request.maxTokens,
    });

    const choice = response.choices[0];
    const usage = response.usage;

    return new AIResponse({
      id: response.id,
      content: choice.message.content ?? '',
      usage: new TokenUsage({
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      }),
      model: response.model,
      created: response.created,
    });
  }

  async embed(texts: string[]): Promise<number[][]> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
    });
    return response.data.map(d => d.embedding);
  }
}
```

- [ ] **Step 3: Implement Azure OpenAI adapter**

```typescript
// modules/ai-gateway/infrastructure/adapters/azure-openai.adapter.ts
import { IAIGatewayService } from '../../domain/services/iai-gateway.service';
import { AIRequest } from '../../domain/entities/ai-request.entity';
import { AIResponse } from '../../domain/entities/ai-response.entity';
import { TokenUsage } from '../../domain/entities/token-usage.entity';
import OpenAI from 'openai';

export interface AzureOpenAIAdapterConfig {
  endpoint: string;
  apiKey: string;
  apiVersion?: string;
  deploymentName: string;
}

export class AzureOpenAIAdapter implements IAIGatewayService {
  private client: OpenAI;

  constructor(private config: AzureOpenAIAdapterConfig) {
    this.client = new OpenAI({
      baseURL: `${config.endpoint}/openai/deployments/${config.deploymentName}`,
      apiKey: config.apiKey,
      defaultQuery: { 'api-version': config.apiVersion ?? '2024-02-01' },
    });
  }

  async chat(request: AIRequest): Promise<AIResponse> {
    const response = await this.client.chat.completions.create({
      messages: request.messages.map(m => ({ role: m.role, content: m.content })),
      temperature: request.temperature,
      max_tokens: request.maxTokens,
    });

    const choice = response.choices[0];
    const usage = response.usage;

    return new AIResponse({
      id: response.id,
      content: choice.message.content ?? '',
      usage: new TokenUsage({
        promptTokens: usage?.prompt_tokens ?? 0,
        completionTokens: usage?.completion_tokens ?? 0,
        totalTokens: usage?.total_tokens ?? 0,
      }),
      model: this.config.deploymentName,
      created: response.created,
    });
  }

  async embed(texts: string[]): Promise<number[][]> {
    const response = await this.client.embeddings.create({
      input: texts,
    });
    return response.data.map(d => d.embedding);
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add modules/ai-gateway/infrastructure/adapters/...
git commit -m "feat(ai-gateway): add OpenAI and Azure OpenAI adapters"
```

---

## Task 4: AI Gateway Application Layer - Use Cases

**Files:**
- Create: `modules/ai-gateway/application/services/chat-use-case.ts`
- Create: `modules/ai-gateway/application/services/embedding-use-case.ts`
- Create: `modules/ai-gateway/application/dto/request/chat-request.dto.ts`
- Create: `modules/ai-gateway/application/dto/request/embed-request.dto.ts`
- Create: `modules/ai-gateway/application/dto/response/chat-response.dto.ts`

- [ ] **Step 1: Write ChatUseCase**

```typescript
// modules/ai-gateway/application/services/chat-use-case.ts
import { Injectable } from '@nestjs/common';
import { IAIGatewayService } from '../../domain/services/iai-gateway.service';
import { AIRequest } from '../../domain/entities/ai-request.entity';
import { ChatRequestDto } from '../dto/request/chat-request.dto';
import { ChatResponseDto } from '../dto/response/chat-response.dto';
import { IRAGService } from '../../../rag/domain/services/irag.service';

@Injectable()
export class ChatUseCase {
  constructor(
    private readonly aiGateway: IAIGatewayService,
    private readonly ragService: IRAGService,
  ) {}

  async execute(dto: ChatRequestDto): Promise<ChatResponseDto> {
    // Build messages
    const messages = [
      { role: 'system' as const, content: dto.systemPrompt ?? '' },
      { role: 'user' as const, content: dto.message },
    ];

    // If RAG enabled, retrieve context
    let context = '';
    if (dto.useRag) {
      const searchResults = await this.ragService.search(dto.message, dto.topK ?? 5);
      if (searchResults.length > 0) {
        context = searchResults
          .map(r => `[Source: ${r.documentId}] ${r.content}`)
          .join('\n\n');
        messages.unshift({ role: 'system', content: `Context:\n${context}` });
      }
    }

    // Call AI
    const request = new AIRequest({
      id: crypto.randomUUID(),
      messages,
      model: dto.model,
      temperature: dto.temperature,
      maxTokens: dto.maxTokens,
      sessionId: dto.sessionId,
      userId: dto.userId,
    });

    const response = await this.aiGateway.chat(request);

    return new ChatResponseDto({
      response: response.content,
      sources: dto.useRag ? await this.ragService.getSources(dto.message) : [],
      usage: response.usage,
      model: response.model,
      latencyMs: response.latencyMs,
    });
  }
}
```

- [ ] **Step 2: Write EmbedUseCase**

```typescript
// modules/ai-gateway/application/services/embedding-use-case.ts
import { Injectable } from '@nestjs/common';
import { IAIGatewayService } from '../../domain/services/iai-gateway.service';
import { EmbedRequestDto } from '../dto/request/embed-request.dto';

export interface EmbedResultDto {
  embeddings: number[][];
  model: string;
}

@Injectable()
export class EmbedUseCase {
  constructor(private readonly aiGateway: IAIGatewayService) {}

  async execute(dto: EmbedRequestDto): Promise<EmbedResultDto> {
    const embeddings = await this.aiGateway.embed(dto.texts);
    return {
      embeddings,
      model: 'text-embedding-3-small',
    };
  }
}
```

- [ ] **Step 3: Write DTOs**

```typescript
// modules/ai-gateway/application/dto/request/chat-request.dto.ts
import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class ChatRequestDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @IsOptional()
  @IsBoolean()
  useRag?: boolean;

  @IsOptional()
  @IsNumber()
  temperature?: number;

  @IsOptional()
  @IsNumber()
  maxTokens?: number;

  @IsOptional()
  @IsNumber()
  topK?: number;

  @IsOptional()
  @IsString()
  provider?: string;
}
```

- [ ] **Step 4: Commit**

```bash
git add modules/ai-gateway/application/...
git commit -m "feat(ai-gateway): add chat and embedding use cases"
```

---

## Task 5: AI Gateway Controller & Interceptors

**Files:**
- Create: `modules/ai-gateway/presentation/controllers/ai-gateway.controller.ts`
- Create: `modules/ai-gateway/presentation/interceptors/token-usage.interceptor.ts`
- Create: `modules/ai-gateway/presentation/guards/api-key.guard.ts`

- [ ] **Step 1: Write TokenUsageInterceptor**

```typescript
// modules/ai-gateway/presentation/interceptors/token-usage.interceptor.ts
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggingService } from '../../../monitoring/application/services/logging.service';
import { MetricsService } from '../../../monitoring/application/services/metrics.service';

@Injectable()
export class TokenUsageInterceptor implements NestInterceptor {
  constructor(
    private readonly loggingService: LoggingService,
    private readonly metricsService: MetricsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, path, body } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(async (response) => {
        const latencyMs = Date.now() - startTime;
        const traceId = response?.traceId ?? crypto.randomUUID();

        // Extract usage if available
        const usage = response?.data?.usage;
        if (usage) {
          await this.metricsService.recordTokenUsage({
            traceId,
            userId: request.user?.id,
            ...usage,
            provider: response.data.provider,
            model: response.data.model,
          });
        }

        // Log API call
        await this.loggingService.log({
          traceId,
          sessionId: body?.sessionId,
          userId: request.user?.id,
          method,
          path,
          statusCode: response?.statusCode ?? 200,
          latencyMs,
          provider: response?.data?.provider,
          model: response?.data?.model,
          useRag: body?.useRag ?? false,
        });
      }),
    );
  }
}
```

- [ ] **Step 2: Write AiGatewayController**

```typescript
// modules/ai-gateway/presentation/controllers/ai-gateway.controller.ts
import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ChatUseCase } from '../../application/services/chat-use-case';
import { EmbedUseCase } from '../../application/services/embedding-use-case';
import { ChatRequestDto } from '../../application/dto/request/chat-request.dto';
import { EmbedRequestDto } from '../../application/dto/request/embed-request.dto';

@Controller('api/v1/ai')
export class AiGatewayController {
  constructor(
    private readonly chatUseCase: ChatUseCase,
    private readonly embedUseCase: EmbedUseCase,
  ) {}

  @Post('chat')
  async chat(@Body() dto: ChatRequestDto) {
    return this.chatUseCase.execute(dto);
  }

  @Post('embed')
  async embed(@Body() dto: EmbedRequestDto) {
    return this.embedUseCase.execute(dto);
  }

  @Get('models')
  async models() {
    return {
      data: [
        { id: 'gpt-4o', provider: 'openai', name: 'GPT-4o' },
        { id: 'gpt-4o-mini', provider: 'openai', name: 'GPT-4o Mini' },
      ],
    };
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add modules/ai-gateway/presentation/...
git commit -m "feat(ai-gateway): add controller and token usage interceptor"
```

---

## Task 6: RAG Domain & Application Layer

**Files:**
- Create: `modules/rag/domain/entities/document.entity.ts`
- Create: `modules/rag/domain/entities/document-chunk.entity.ts`
- Create: `modules/rag/domain/value-objects/chunk-strategy.vo.ts`
- Create: `modules/rag/domain/services/irag.service.ts`
- Create: `modules/rag/domain/services/idocument-connector.interface.ts`
- Create: `modules/rag/application/services/rag.service.ts`
- Create: `modules/rag/application/connectors/file-system.connector.ts`
- Create: `modules/rag/application/connectors/database.connector.ts`

- [ ] **Step 1: Write DocumentChunk entity**

```typescript
// modules/rag/domain/entities/document-chunk.entity.ts
import { Entity } from '@src/shared/domain/entity';

export interface ChunkMetadata {
  documentId: string;
  source: string;
  chunkIndex: number;
  totalChunks: number;
  createdAt: Date;
}

export interface DocumentChunkProps {
  id: string;
  content: string;
  embedding: number[];
  metadata: ChunkMetadata;
}

export class DocumentChunk extends Entity<DocumentChunkProps> {
  get content(): string { return this.props.content; }
  get embedding(): number[] { return this.props.embedding; }
  get metadata(): ChunkMetadata { return this.props.metadata; }
}
```

- [ ] **Step 2: Write IRAGService interface**

```typescript
// modules/rag/domain/services/irag.service.ts
import { SearchResult } from '../dto/search-result.dto';

export interface IRAGService {
  search(query: string, topK?: number): Promise<SearchResult[]>;
  indexDocuments(source: string, options?: IndexOptions): Promise<void>;
  getSources(query: string): Promise<SourceDocument[]>;
}

export interface IndexOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  chunkStrategy?: 'characters' | 'paragraphs' | 'sentences';
}
```

- [ ] **Step 3: Write FileSystemConnector**

```typescript
// modules/rag/application/connectors/file-system.connector.ts
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { IDocumentConnector } from '../../domain/services/idocument-connector.interface';

@Injectable()
export class FileSystemConnector implements IDocumentConnector {
  async fetch(sourcePath: string): Promise<RawDocument[]> {
    const documents: RawDocument[] = [];
    
    const walkDir = async (dirPath: string) => {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          await walkDir(fullPath);
        } else if (this.isSupportedFile(entry.name)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          documents.push({
            id: crypto.randomUUID(),
            source: 'filesystem',
            sourcePath: fullPath,
            content,
            metadata: { fileName: entry.name },
          });
        }
      }
    };
    
    await walkDir(sourcePath);
    return documents;
  }

  private isSupportedFile(fileName: string): boolean {
    const ext = path.extname(fileName).toLowerCase();
    return ['.md', '.txt', '.pdf', '.docx'].includes(ext);
  }
}
```

- [ ] **Step 4: Write RAGService**

```typescript
// modules/rag/application/services/rag.service.ts
import { Injectable } from '@nestjs/common';
import { IRAGService } from '../../domain/services/irag.service';
import { IDocumentConnector } from '../../domain/services/idocument-connector.interface';
import { PgVectorStoreService } from '../../infrastructure/vector-store/pg-vector-store.service';
import { OpenAIEmbeddingService } from '../../infrastructure/embedding/openai-embedding.service';
import { SearchResultDto } from '../dto/search-result.dto';

@Injectable()
export class RAGService implements IRAGService {
  constructor(
    private readonly vectorStore: PgVectorStoreService,
    private readonly embeddingService: OpenAIEmbeddingService,
  ) {}

  async search(query: string, topK: number = 5): Promise<SearchResultDto[]> {
    // Embed query
    const queryEmbedding = await this.embeddingService.embed([query]);
    
    // Search vector store
    const results = await this.vectorStore.similaritySearch(queryEmbedding[0], topK);
    
    return results.map(r => ({
      documentId: r.metadata.documentId,
      chunkId: r.id,
      content: r.content,
      score: r.score,
    }));
  }

  async indexDocuments(source: string, options?: IndexOptions): Promise<void> {
    // Implementation for indexing
  }

  async getSources(query: string): Promise<SourceDocument[]> {
    const results = await this.search(query, 3);
    return results.map(r => ({
      documentId: r.documentId,
      chunkId: r.chunkId,
      score: r.score,
    }));
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add modules/rag/domain/... modules/rag/application/...
git commit -m "feat(rag): add domain entities, interfaces, and RAG service"
```

---

## Task 7: RAG Infrastructure - Vector Store & Embedding

**Files:**
- Create: `modules/rag/infrastructure/vector-store/pg-vector-store.service.ts`
- Create: `modules/rag/infrastructure/embedding/openai-embedding.service.ts`
- Create: `src/infrastructure/database/schema/rag-chunks.schema.ts`

- [ ] **Step 1: Write pg-vector schema**

```typescript
// src/infrastructure/database/schema/rag-chunks.schema.ts
import { pgTable, uuid, text, vector, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';

export const ragChunks = pgTable('rag_chunks', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull(),
  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: 1536 }).notNull(),
  
  // Metadata
  source: text('source').notNull(),        // filesystem, notion, etc.
  sourcePath: text('source_path'),          // original file path or URL
  chunkIndex: integer('chunk_index').notNull(),
  totalChunks: integer('total_chunks').notNull(),
  
  // Search metadata (stored for filtering)
  filters: jsonb('filters'),
  
  createdAt: timestamp('created_at').defaultNow(),
});

// Enable pgvector extension check in migration
```

- [ ] **Step 2: Write PgVectorStoreService**

```typescript
// modules/rag/infrastructure/vector-store/pg-vector-store.service.ts
import { Injectable } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { PgVectorStoreService } from './pg-vector-store.service';
import { ragChunks } from '@src/infrastructure/database/schema/rag-chunks.schema';

export interface VectorSearchResult {
  id: string;
  content: string;
  metadata: Record<string, any>;
  score: number;
}

@Injectable()
export class PgVectorStoreService {
  private db;

  constructor() {
    this.db = drizzle(process.env.DATABASE_URL);
  }

  async similaritySearch(
    queryEmbedding: number[],
    topK: number,
    filters?: Record<string, any>,
  ): Promise<VectorSearchResult[]> {
    const results = await this.db
      .select()
      .from(ragChunks)
      .orderBy(sql`embedding <=> ${queryEmbedding}`)
      .limit(topK);

    return results.map(row => ({
      id: row.id,
      content: row.content,
      metadata: {
        documentId: row.documentId,
        source: row.source,
        sourcePath: row.sourcePath,
      },
      score: 1 - (row.embedding <=> queryEmbedding), // cosine distance
    }));
  }

  async upsertBatch(chunks: DocumentChunk[]): Promise<void> {
    // Batch insert with upsert
    await this.db.insert(ragChunks).values(chunks.map(c => ({
      id: c.id,
      documentId: c.metadata.documentId,
      content: c.content,
      embedding: c.embedding,
      source: c.metadata.source,
      sourcePath: c.metadata.sourcePath,
      chunkIndex: c.metadata.chunkIndex,
      totalChunks: c.metadata.totalChunks,
    }))).onConflictDoUpdate();
  }
}
```

- [ ] **Step 3: Write OpenAIEmbeddingService**

```typescript
// modules/rag/infrastructure/embedding/openai-embedding.service.ts
import { Injectable } from '@nestjs/common';
import { IAIGatewayService } from '../../../ai-gateway/domain/services/iai-gateway.service';

@Injectable()
export class OpenAIEmbeddingService {
  constructor(private readonly aiGateway: IAIGatewayService) {}

  async embed(texts: string[]): Promise<number[][]> {
    return this.aiGateway.embed(texts);
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add modules/rag/infrastructure/... src/infrastructure/database/schema/rag-chunks.schema.ts
git commit -m "feat(rag): add pgvector store and embedding service"
```

---

## Task 8: Monitoring Module

**Files:**
- Create: `modules/monitoring/domain/entities/api-log.entity.ts`
- Create: `modules/monitoring/domain/entities/token-usage-log.entity.ts`
- Create: `modules/monitoring/application/services/logging.service.ts`
- Create: `modules/monitoring/application/services/metrics.service.ts`
- Create: `modules/monitoring/infrastructure/repositories/postgres-log.repository.ts`

- [ ] **Step 1: Write LoggingService**

```typescript
// modules/monitoring/application/services/logging.service.ts
import { Injectable } from '@nestjs/common';
import { ILogRepository } from '../../domain/repositories/ilog.repository';

export interface LogEntry {
  traceId: string;
  sessionId?: string;
  userId?: string;
  method: string;
  path: string;
  statusCode: number;
  latencyMs: number;
  provider?: string;
  model?: string;
  useRag: boolean;
  errorCode?: string;
  errorMessage?: string;
}

@Injectable()
export class LoggingService {
  constructor(private readonly logRepository: ILogRepository) {}

  async log(entry: LogEntry): Promise<void> {
    await this.logRepository.save(entry);
  }

  async findLogs(filters: LogFilters): Promise<LogEntry[]> {
    return this.logRepository.findMany(filters);
  }
}
```

- [ ] **Step 2: Write MetricsService**

```typescript
// modules/monitoring/application/services/metrics.service.ts
import { Injectable } from '@nestjs/common';
import { ILogRepository } from '../../domain/repositories/ilog.repository';

export interface TokenUsageRecord {
  traceId: string;
  userId?: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  provider: string;
  model: string;
  estimatedCostUsd?: number;
}

export interface AggregatedMetrics {
  totalRequests: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  avgLatencyMs: number;
  errorRate: number;
  ragHitRate: number;
  costUsd: number;
}

@Injectable()
export class MetricsService {
  constructor(private readonly logRepository: ILogRepository) {}

  async recordTokenUsage(record: TokenUsageRecord): Promise<void> {
    await this.logRepository.saveTokenUsage(record);
  }

  async aggregateMetrics(filters: MetricFilters): Promise<AggregatedMetrics> {
    return this.logRepository.aggregateMetrics(filters);
  }
}
```

- [ ] **Step 3: Write PostgresLogRepository**

```typescript
// modules/monitoring/infrastructure/repositories/postgres-log.repository.ts
import { Injectable } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { aiApiLogs, aiTokenUsage } from '@src/infrastructure/database/schema';

export interface ILogRepository {
  save(entry: any): Promise<void>;
  findMany(filters: any): Promise<any[]>;
  aggregateMetrics(filters: any): Promise<any>;
}

@Injectable()
export class PostgresLogRepository implements ILogRepository {
  private db;

  constructor() {
    this.db = drizzle(process.env.DATABASE_URL);
  }

  async save(entry: any): Promise<void> {
    await this.db.insert(aiApiLogs).values(entry);
  }

  async saveTokenUsage(record: any): Promise<void> {
    await this.db.insert(aiTokenUsage).values(record);
  }

  async findMany(filters: any): Promise<any[]> {
    return this.db.select().from(aiApiLogs).limit(filters.limit ?? 100);
  }

  async aggregateMetrics(filters: any): Promise<any> {
    // Aggregate query
    const result = await this.db
      .select({
        totalRequests: sql`count(*)`,
        totalPromptTokens: sql`sum(prompt_tokens)`,
        avgLatencyMs: sql`avg(latency_ms)`,
      })
      .from(aiApiLogs)
      .where(between(
        aiApiLogs.createdAt,
        filters.startDate,
        filters.endDate
      ));
    return result[0];
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add modules/monitoring/...
git commit -m "feat(monitoring): add logging and metrics services"
```

---

## Task 9: Module Wiring - App Module Integration

**Files:**
- Create: `modules/ai-gateway/ai-gateway.module.ts`
- Create: `modules/rag/rag.module.ts`
- Create: `modules/monitoring/monitoring.module.ts`
- Modify: `src/app.module.ts`

- [ ] **Step 1: Write AiGatewayModule**

```typescript
// modules/ai-gateway/ai-gateway.module.ts
import { Module } from '@nestjs/common';
import { AiGatewayController } from './presentation/controllers/ai-gateway.controller';
import { ChatUseCase } from './application/services/chat-use-case';
import { EmbedUseCase } from './application/services/embedding-use-case';
import { OpenAIAdapter } from './infrastructure/adapters/openai.adapter';
import { TokenUsageInterceptor } from './presentation/interceptors/token-usage.interceptor';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [MonitoringModule, RagModule],
  controllers: [AiGatewayController],
  providers: [
    ChatUseCase,
    EmbedUseCase,
    OpenAIAdapter,
    {
      provide: IAIGatewayService,
      useClass: OpenAIAdapter,
    },
    TokenUsageInterceptor,
  ],
  exports: [IAIGatewayService],
})
export class AiGatewayModule {}
```

- [ ] **Step 2: Write RagModule**

```typescript
// modules/rag/rag.module.ts
import { Module } from '@nestjs/common';
import { RAGService } from './application/services/rag.service';
import { FileSystemConnector } from './application/connectors/file-system.connector';
import { DatabaseConnector } from './application/connectors/database.connector';
import { PgVectorStoreService } from './infrastructure/vector-store/pg-vector-store.service';
import { OpenAIEmbeddingService } from './infrastructure/embedding/openai-embedding.service';
import { AiGatewayModule } from '../ai-gateway/ai-gateway.module';

@Module({
  imports: [AiGatewayModule],
  providers: [
    RAGService,
    FileSystemConnector,
    DatabaseConnector,
    PgVectorStoreService,
    OpenAIEmbeddingService,
  ],
  exports: [RAGService],
})
export class RagModule {}
```

- [ ] **Step 3: Write MonitoringModule**

```typescript
// modules/monitoring/monitoring.module.ts
import { Module } from '@nestjs/common';
import { LoggingService } from './application/services/logging.service';
import { MetricsService } from './application/services/metrics.service';
import { PostgresLogRepository } from './infrastructure/repositories/postgres-log.repository';

@Module({
  providers: [
    LoggingService,
    MetricsService,
    PostgresLogRepository,
  ],
  exports: [LoggingService, MetricsService],
})
export class MonitoringModule {}
```

- [ ] **Step 4: Commit**

```bash
git add modules/ai-gateway/ai-gateway.module.ts modules/rag/rag.module.ts modules/monitoring/monitoring.module.ts
git commit -m "feat: wire AI Gateway, RAG, and Monitoring modules"
```

---

## Task 10: Admin Endpoints - Indexing & Metrics

**Files:**
- Create: `modules/ai-gateway/presentation/controllers/ai-admin.controller.ts`
- Modify: `modules/ai-gateway/ai-gateway.module.ts`

- [ ] **Step 1: Write AiAdminController**

```typescript
// modules/ai-gateway/presentation/controllers/ai-admin.controller.ts
import { Controller, Post, Get, Delete, Body, Param, Query } from '@nestjs/common';
import { RAGService } from '../../../rag/application/services/rag.service';
import { LoggingService } from '../../../monitoring/application/services/logging.service';
import { MetricsService } from '../../../monitoring/application/services/metrics.service';
import { IndexRequestDto } from '../../../rag/application/dto/index-request.dto';

@Controller('api/v1/ai/admin')
export class AiAdminController {
  constructor(
    private readonly ragService: RAGService,
    private readonly loggingService: LoggingService,
    private readonly metricsService: MetricsService,
  ) {}

  @Post('index')
  async indexDocuments(@Body() dto: IndexRequestDto) {
    await this.ragService.indexDocuments(dto.source, {
      chunkSize: dto.chunkSize,
      chunkOverlap: dto.chunkOverlap,
    });
    return { success: true };
  }

  @Delete('index/:source')
  async deleteIndexedDocuments(@Param('source') source: string) {
    // Implementation
    return { success: true };
  }

  @Get('logs')
  async getLogs(@Query() filters: any) {
    const logs = await this.loggingService.findLogs(filters);
    return { data: logs };
  }

  @Get('metrics')
  async getMetrics(@Query() filters: any) {
    const metrics = await this.metricsService.aggregateMetrics(filters);
    return { data: metrics };
  }

  @Get('metrics/prometheus')
  async getPrometheusMetrics(@Query() filters: any) {
    const metrics = await this.metricsService.aggregateMetrics(filters);
    // Format as Prometheus text
    return `# HELP ai_total_requests Total AI API requests
# TYPE ai_total_requests counter
ai_total_requests ${metrics.totalRequests}
...`;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add modules/ai-gateway/presentation/controllers/ai-admin.controller.ts
git commit -m "feat(ai-gateway): add admin endpoints for indexing and metrics"
```

---

## Implementation Order

1. **Database Schemas** — Pre-requisite for all logging
2. **AI Gateway Domain** — Core interfaces and entities
3. **OpenAI Adapter** — First provider implementation
4. **Chat/Embedding Use Cases** — Application logic
5. **Controller & Interceptor** — HTTP layer
6. **RAG Domain & Application** — RAG service and connectors
7. **RAG Infrastructure** — Vector store and embedding
8. **Monitoring Module** — Logging and metrics
9. **Module Wiring** — Connect all pieces
10. **Admin Endpoints** — Indexing and metrics APIs

---

## Notes

- pgvector extension must be enabled: `CREATE EXTENSION IF NOT EXISTS vector;`
- `embedding` column dimension is 1536 for `text-embedding-3-small`, use 3072 for `text-embedding-3-large`
- Provider fallback logic should be implemented in `AIGatewayService` after adapters are wired
