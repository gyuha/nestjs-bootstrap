import { EventEmitter } from 'node:events';
import type { Response } from 'express';
import type { AppLogger, RequestLogEntry } from '../../infrastructure/logging/app-logger';
import type { HttpRequestWithTrace } from '../types/http-request-with-trace';
import { createRequestLoggingMiddleware } from './request-logging.middleware';

class InMemoryAppLogger implements AppLogger {
  entries: RequestLogEntry[] = [];

  logRequest(entry: RequestLogEntry): void {
    this.entries.push(entry);
  }
}

describe('createRequestLoggingMiddleware', () => {
  it('logs request path without query string', () => {
    const logger = new InMemoryAppLogger();
    const request = {
      method: 'GET',
      originalUrl: '/api/health?token=secret',
      path: '/api/health',
      traceId: 'trace-id',
    } as HttpRequestWithTrace;
    const response = Object.assign(new EventEmitter(), {
      statusCode: 200,
    }) as Response & EventEmitter;
    const next = jest.fn();

    createRequestLoggingMiddleware(logger)(request, response, next);
    response.emit('finish');

    expect(next).toHaveBeenCalledTimes(1);
    expect(logger.entries).toHaveLength(1);
    expect(logger.entries[0]).toMatchObject({
      method: 'GET',
      path: '/api/health',
      statusCode: 200,
      traceId: 'trace-id',
    });
  });
});
