import { Injectable, Logger } from '@nestjs/common';

export interface MetricsSnapshot {
  uptime: number;
  requests: {
    total: number;
    byStatus: Record<string, number>;
    byMethod: Record<string, number>;
  };
  latency: { p50: number; p95: number; p99: number };
  errors: {
    client4xx: number;
    server5xx: number;
    byType: Record<string, number>;
  };
}

const WINDOW_SIZE = 1000;

@Injectable()
export class MetricsStore implements Disposable {
  private readonly logger = new Logger(MetricsStore.name);
  private readonly startTime = Date.now();
  private totalRequests = 0;
  private readonly byStatus: Record<string, number> = {};
  private readonly byMethod: Record<string, number> = {};
  private client4xx = 0;
  private server5xx = 0;
  private readonly latencyWindow: number[] = [];
  private summaryTimer: ReturnType<typeof setInterval> | undefined;

  constructor() {
    this.summaryTimer = setInterval(() => this.logSummary(), 60_000);
  }

  record(method: string, statusCode: number, durationMs: number): void {
    this.totalRequests++;
    this.byStatus[String(statusCode)] =
      (this.byStatus[String(statusCode)] ?? 0) + 1;
    this.byMethod[method] = (this.byMethod[method] ?? 0) + 1;

    if (statusCode >= 400 && statusCode < 500) this.client4xx++;
    if (statusCode >= 500) this.server5xx++;

    this.latencyWindow.push(durationMs);
    if (this.latencyWindow.length > WINDOW_SIZE) {
      this.latencyWindow.shift();
    }
  }

  snapshot(): MetricsSnapshot {
    return {
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      requests: {
        total: this.totalRequests,
        byStatus: { ...this.byStatus },
        byMethod: { ...this.byMethod },
      },
      latency: this.computePercentiles(),
      errors: {
        client4xx: this.client4xx,
        server5xx: this.server5xx,
        byType: {},
      },
    };
  }

  reset(): void {
    this.totalRequests = 0;
    for (const k of Object.keys(this.byStatus)) delete this.byStatus[k];
    for (const k of Object.keys(this.byMethod)) delete this.byMethod[k];
    this.client4xx = 0;
    this.server5xx = 0;
    this.latencyWindow.length = 0;
  }

  [Symbol.dispose](): void {
    if (this.summaryTimer) clearInterval(this.summaryTimer);
  }

  private computePercentiles(): { p50: number; p95: number; p99: number } {
    if (this.latencyWindow.length === 0) {
      return { p50: 0, p95: 0, p99: 0 };
    }
    const sorted = [...this.latencyWindow].sort((a, b) => a - b);
    return {
      p50: sorted[Math.floor(sorted.length * 0.5)] ?? 0,
      p95: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
      p99: sorted[Math.floor(sorted.length * 0.99)] ?? 0,
    };
  }

  private logSummary(): void {
    const snap = this.snapshot();
    this.logger.log({
      msg: 'metrics summary',
      requests: snap.requests.total,
      errors: snap.errors.client4xx + snap.errors.server5xx,
      p95: snap.latency.p95,
    });
  }
}
