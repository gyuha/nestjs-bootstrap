import { randomUUID } from 'node:crypto';
import type { Params } from 'nestjs-pino';

/**
 * Pino 로거의 기본 설정 객체.
 * 로그 레벨, 포맷, 트레이스 ID 포함 여부를 정의하며,
 * 개발 환경에서는 pino-pretty로 컬러 출력, 운영 환경에서는 JSON 포맷으로 기록한다.
 */
export const pinoConfig: Params = {
  pinoHttp: {
    genReqId: (req) =>
      (req.headers['x-trace-id'] as string | undefined) ?? randomUUID(),
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport:
      process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: { colorize: true, singleLine: true },
          }
        : undefined,
    autoLogging: true,
  },
};
