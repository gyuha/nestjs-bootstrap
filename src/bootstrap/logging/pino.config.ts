import type { Params } from 'nestjs-pino';
import { randomUUID } from 'crypto';

export const pinoConfig: Params = {
  pinoHttp: {
    genReqId: (req) =>
      (req.headers['x-trace-id'] as string | undefined) ?? randomUUID(),
    level: process.env['NODE_ENV'] === 'production' ? 'info' : 'debug',
    transport:
      process.env['NODE_ENV'] !== 'production'
        ? {
            target: 'pino-pretty',
            options: { colorize: true, singleLine: true },
          }
        : undefined,
    autoLogging: true,
  },
};
