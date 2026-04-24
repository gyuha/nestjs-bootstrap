import { Injectable, Logger } from '@nestjs/common';

export type RequestLogEntry = {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  traceId: string;
};

export abstract class AppLogger {
  abstract logRequest(entry: RequestLogEntry): void;
}

@Injectable()
export class NestAppLogger implements AppLogger {
  private readonly logger = new Logger('HTTP');

  logRequest(entry: RequestLogEntry): void {
    this.logger.log(
      JSON.stringify({
        method: entry.method,
        path: entry.path,
        statusCode: entry.statusCode,
        durationMs: entry.durationMs,
        traceId: entry.traceId,
      }),
    );
  }
}
