import { Injectable, Logger } from '@nestjs/common';

/** 메트릭 스냅샷 데이터 구조 — 업타임, 요청 집계, 레이턴시 백분위수, 에러 카운트를 포함한다 */
export interface MetricsSnapshot {
  /** 애플리케이션 시작 이후 경과 시간(초) */
  uptime: number;
  /** HTTP 요청 집계 */
  requests: {
    /** 전체 요청 수 */
    total: number;
    /** HTTP 상태 코드별 요청 수 */
    byStatus: Record<string, number>;
    /** HTTP 메서드별 요청 수 */
    byMethod: Record<string, number>;
  };
  /** 레이턴시 백분위수(ms) */
  latency: { p50: number; p95: number; p99: number };
  /** 에러 카운트 */
  errors: {
    /** 4xx 클라이언트 에러 수 */
    client4xx: number;
    /** 5xx 서버 에러 수 */
    server5xx: number;
    /** 에러 타입별 카운트 */
    byType: Record<string, number>;
  };
}

/** 레이턴시 슬라이딩 윈도우 최대 크기 */
const WINDOW_SIZE = 1000;

/** HTTP 요청 메트릭(요청 수, 레이턴시, 에러)을 인메모리에 집계하고 주기적으로 로그에 요약하는 서비스 */
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

  /**
   * 단일 HTTP 요청의 메트릭을 기록한다.
   * 상태 코드에 따라 4xx/5xx 에러 카운터를 증가시키고 레이턴시 슬라이딩 윈도우에 추가한다.
   * @param method HTTP 메서드(예: 'GET', 'POST')
   * @param statusCode HTTP 응답 상태 코드
   * @param durationMs 요청 처리 소요 시간(밀리초)
   */
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

  /**
   * 현재 수집된 메트릭의 불변 스냅샷을 반환한다.
   * @returns 업타임, 요청 집계, 레이턴시 백분위수, 에러 카운트를 포함한 MetricsSnapshot
   */
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

  /** 모든 메트릭 카운터와 레이턴시 윈도우를 초기화한다 */
  reset(): void {
    this.totalRequests = 0;
    for (const k of Object.keys(this.byStatus)) delete this.byStatus[k];
    for (const k of Object.keys(this.byMethod)) delete this.byMethod[k];
    this.client4xx = 0;
    this.server5xx = 0;
    this.latencyWindow.length = 0;
  }

  /** 주기적 요약 로그 타이머를 정리하여 리소스를 해제한다 */
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
