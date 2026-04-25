import { Injectable } from '@nestjs/common';

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
  useRag?: boolean;
  error?: string;
}

@Injectable()
export class LoggingService {
  async log(entry: LogEntry): Promise<void> {
    console.log('[LogEntry]', JSON.stringify(entry));
  }
}
