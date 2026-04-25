# AI Gateway + RAG Pipeline + Monitoring Design

**Date:** 2026-04-25
**Status:** Draft

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      API Client                             │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   AI Gateway Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ OpenAI      │  │ Azure OpenAI│  │ Future Providers    │  │
│  │ Adapter     │  │ Adapter     │  │ (Anthropic, etc.)   │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         └────────────────┼───────────────────┘              │
│                          ▼                                  │
│              ┌───────────────────────┐                    │
│              │  Unified AI Gateway   │                    │
│              │  (Provider Agnostic)  │                    │
│              └───────────┬───────────┘                    │
└──────────────────────────┼──────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
┌─────────────────┐ ┌──────────────┐ ┌──────────────────┐
│  RAG Pipeline   │ │   Logging   │ │   Monitoring     │
│  Layer          │ │   Layer     │ │   Layer          │
└─────────────────┘ └──────────────┘ └──────────────────┘
```

**Core Design Principles:**
- Gateway uses adapter pattern so any AI provider can be swapped
- RAG and Monitoring operate independently from gateway
- Leverages existing PostgreSQL + pgvector infrastructure

---

## 2. Module Structure

New modules: `ai-gateway`, `rag`, `monitoring`

```
modules/ai-gateway/
├── domain/
│   ├── entities/          # AIRequest, AIResponse, TokenUsage
│   ├── value-objects/     # ProviderType, ModelId, EmbeddingVector
│   ├── repositories/     # IAIModelRepository (interface)
│   └── services/         # IAIGatewayService (interface)
│
├── application/
│   ├── services/         # AIGatewayService, ChatUseCase, EmbeddingUseCase
│   └── dto/
│       ├── request/      # ChatRequestDto, EmbedRequestDto
│       └── response/     # ChatResponseDto
│
├── infrastructure/
│   ├── adapters/         # OpenAIAdapter, AzureOpenAIAdapter
│   └── services/         # VectorStoreService
│
└── presentation/
    ├── controllers/     # AiGatewayController
    └── interceptors/     # TokenUsageInterceptor

modules/rag/
├── domain/
│   ├── entities/         # Document, DocumentChunk, ChunkMetadata
│   ├── value-objects/    # ChunkStrategy
│   └── services/         # IRAGService, IDocumentConnector
├── application/
│   ├── services/         # RAGService
│   └── connectors/       # FileSystemConnector, NotionConnector,
│                         # ConfluenceConnector, SharePointConnector,
│                         # DatabaseConnector
└── infrastructure/
    ├── embedding/       # OpenAIEmbeddingService
    └── vector-store/     # PgVectorStoreService

modules/monitoring/
├── domain/
│   └── entities/         # APILog, TokenUsageLog, MetricEvent
├── application/
│   ├── services/         # LoggingService, MetricsService
│   └── dto/
└── infrastructure/
    ├── repositories/    # PostgresLogRepository
    └── exporters/       # PrometheusExporter
```

**Dependency Direction:**
- `presentation` → `application` → `domain`
- `infrastructure` implements `domain` interfaces and gets injected
- Modules communicate only through well-defined interfaces

---

## 3. Data Flow

### Chat (RAG + AI Gateway)

1. Client → `POST /api/v1/ai/chat`
2. `AiGatewayController` → `ChatUseCase.execute()`
3. `RAGPipelineService.process(query)`
   - Document connectors fetch relevant documents
   - Query embedded via `OpenAIEmbeddingService`
   - `PgVectorStoreService.similaritySearch()` returns context
4. `AIGatewayService.chat(messages + retrievedContext)`
   - OpenAI Adapter calls provider API
5. `TokenUsageInterceptor` captures token usage + latency
6. `LoggingService.log()` saves to PostgreSQL
7. Client receives `{ response, sources, usage, latency }`

### Document Indexing (RAG Pipeline)

1. Admin → `POST /api/v1/ai/admin/index`
2. `DocumentConnectorService.fetch()` via appropriate connector
3. `ChunkDocuments()` with configured `ChunkStrategy`
4. `OpenAIEmbeddingService.embedBatch()` → vectors
5. `PgVectorStoreService.upsertBatch()` stores chunks + metadata
6. Monitoring logs indexed document count

### Monitoring / Analytics

1. `MetricsCollector` intercepts every API call
2. `MetricsService.aggregate()` computes:
   - tokenUsageByDay, tokenUsageByUser
   - avgLatencyByProvider
   - errorRate
   - RAGHitRate
3. `GET /api/v1/ai/admin/metrics` returns Prometheus format or JSON

---

## 4. API Endpoints

### AI Gateway (Client-facing)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/ai/chat` | RAG-enhanced chat |
| POST | `/api/v1/ai/embed` | Embedding only |
| GET | `/api/v1/ai/models` | List available models |

### RAG Admin

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/ai/admin/index` | Trigger indexing |
| DELETE | `/api/v1/ai/admin/index/:source` | Remove indexed docs |
| GET | `/api/v1/ai/admin/index/status` | Indexing status |

### Monitoring

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/ai/admin/logs` | API logs (with filters) |
| GET | `/api/v1/ai/admin/metrics` | Aggregated metrics |
| GET | `/api/v1/ai/admin/metrics/prometheus` | Prometheus endpoint |

### Request/Response Example

```typescript
// POST /api/v1/ai/chat
// Request
{ 
  "message": "내 계약서 중 해지 관련 조항을 찾아줘",
  "sessionId": "user-123-session-456",
  "useRag": true,
  "provider": "openai"
}

// Response
{
  "data": {
    "response": "계약서 제7조에 따르면...",
    "sources": [
      { "documentId": "doc-1", "chunkId": "chunk-42", "score": 0.92 }
    ],
    "usage": {
      "promptTokens": 1200,
      "completionTokens": 150,
      "totalTokens": 1350
    },
    "provider": "openai",
    "model": "gpt-4o",
    "latencyMs": 1250
  }
}
```

---

## 5. Error Handling

### Error Hierarchy

| Layer | Error Type | Examples |
|-------|-----------|----------|
| Domain | `BusinessError` | Quota exceeded, invalid model |
| Application | `ValidationError`, `NotFoundError` | Missing required fields |
| Infrastructure | `ProviderError`, `DatabaseError` | AI API timeout, connection failed |
| Presentation | `HttpError` | 4xx/5xx mapping |

### Provider Fallback

```
Request → OpenAI Adapter
              │
              ├─(timeout 30s / 5xx error)
              ▼
         Retry with exponential backoff (max 3 retries)
              │
              ├─(still failing)
              ▼
         Try Azure OpenAI (if configured)
              │
              └─(all providers fail)
              ▼
         Return UserError: "AI service temporarily unavailable"
```

### Error Response Format

```typescript
{
  "error": {
    "code": "PROVIDER_ERROR",
    "message": "AI service temporarily unavailable",
    "details": {
      "provider": "openai",
      "retries": 3,
      "lastError": "Connection timeout"
    },
    "traceId": "abc-123"
  }
}
```

### RAG-specific Fallbacks

| Scenario | Behavior |
|----------|----------|
| No documents found for query | Proceed without RAG context, `ragHitRate: 0` |
| Vector store unavailable | Fallback to raw keyword search |
| Document connector fails | Log error, skip that source, continue with others |

---

## 6. Supported Sources

| Source | Connector | Status |
|--------|-----------|--------|
| File System (PDF, MD, DOCX) | FileSystemConnector | Implemented |
| PostgreSQL | DatabaseConnector | Implemented |
| Notion | NotionConnector | Future |
| Confluence | ConfluenceConnector | Future |
| SharePoint | SharePointConnector | Future |

---

## 7. Environment Variables

```typescript
// AI Providers
OPENAI_API_KEY=sk-...
AZURE_OPENAI_ENDPOINT=https://...openai.azure.com
AZURE_OPENAI_API_KEY=...

// Vector Store
DATABASE_URL=postgresql://...

// RAG
RAG_CHUNK_SIZE=500
RAG_CHUNK_OVERLAP=50

// Monitoring
LOG_RETENTION_DAYS=30
METRICS_ENABLED=true
```

---

## 8. Testing Strategy

- **Unit tests** for each use case and adapter (mock provider responses)
- **Integration tests** for RAG pipeline with real vector store
- **E2E tests** for full chat + RAG + logging flow
