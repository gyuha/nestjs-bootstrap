import { Injectable } from '@nestjs/common';

export interface TokenUsageRecord {
  traceId: string;
  userId?: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  provider?: string;
  model?: string;
}

@Injectable()
export class MetricsService {
  async recordTokenUsage(record: TokenUsageRecord): Promise<void> {
    console.log('[TokenUsage]', JSON.stringify(record));
  }
}
