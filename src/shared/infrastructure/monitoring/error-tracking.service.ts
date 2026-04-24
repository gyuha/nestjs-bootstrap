import { Injectable, Logger } from '@nestjs/common';

/** HTTP 예외 추적 시 수집하는 에러 컨텍스트 정보 */
export interface ErrorContext {
  traceId: string;
  method: string;
  path: string;
  statusCode: number;
  message: string;
  timestamp: string;
  userId: string | null;
  stack?: string;
}

/** HTTP 예외를 수집하고 히스토그램으로 집계하는 에러 추적 서비스 */
@Injectable()
export class ErrorTrackingService {
  private readonly logger = new Logger(ErrorTrackingService.name);
  private readonly histogram: Record<string, number> = {};

  /** 에러 컨텍스트를 히스토그램에 기록하고 로그를 남긴다.
   * @param ctx 기록할 에러 컨텍스트 정보
   */
  record(ctx: ErrorContext): void {
    const key = `${ctx.statusCode} ${ctx.method} ${ctx.path}`;
    this.histogram[key] = (this.histogram[key] ?? 0) + 1;

    const logData = {
      traceId: ctx.traceId,
      method: ctx.method,
      path: ctx.path,
      statusCode: ctx.statusCode,
      message: ctx.message,
      ...(ctx.userId ? { userId: ctx.userId } : {}),
    };

    if (ctx.statusCode >= 500) {
      this.logger.error({ ...logData, stack: ctx.stack });
    } else {
      this.logger.warn(logData);
    }
  }

  /** 현재까지 수집된 에러 히스토그램 요약을 반환한다.
   * @returns 에러 키(statusCode method path)별 발생 횟수 맵
   */
  getSummary(): Record<string, number> {
    return { ...this.histogram };
  }
}
