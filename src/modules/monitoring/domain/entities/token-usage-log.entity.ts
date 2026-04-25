export interface TokenUsageRecord {
  traceId: string;
  userId?: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  provider: string;
  model: string;
  estimatedCostCents?: number;
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
