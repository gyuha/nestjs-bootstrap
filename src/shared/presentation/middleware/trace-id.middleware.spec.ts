import type { NextFunction, Response } from 'express';
import type { HttpRequestWithTrace } from '../types/http-request-with-trace';
import { TRACE_ID_HEADER, traceIdMiddleware } from './trace-id.middleware';

function createRequest(headerValue: string | undefined): HttpRequestWithTrace {
  return {
    header: jest.fn().mockReturnValue(headerValue),
  } as unknown as HttpRequestWithTrace;
}

function createResponse(): Response {
  return {
    setHeader: jest.fn(),
  } as unknown as Response;
}

describe('traceIdMiddleware', () => {
  it('trims and reuses safe inbound trace ids', () => {
    const request = createRequest('  trace_123.ok:abc-def  ');
    const response = createResponse();
    const next: NextFunction = jest.fn();

    traceIdMiddleware(request, response, next);

    expect(request.traceId).toBe('trace_123.ok:abc-def');
    expect(response.setHeader).toHaveBeenCalledWith(TRACE_ID_HEADER, 'trace_123.ok:abc-def');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it.each([
    'unsafe trace id',
    '   ',
    'a'.repeat(129),
  ])('generates a trace id for invalid inbound trace id %p', (headerValue) => {
    const request = createRequest(headerValue);
    const response = createResponse();
    const next: NextFunction = jest.fn();

    traceIdMiddleware(request, response, next);

    expect(request.traceId).toBeDefined();
    expect(request.traceId).not.toBe(headerValue);
    expect(response.setHeader).toHaveBeenCalledWith(TRACE_ID_HEADER, request.traceId);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('reuses safe 128 character trace ids', () => {
    const traceId = 'a'.repeat(128);
    const request = createRequest(traceId);
    const response = createResponse();
    const next: NextFunction = jest.fn();

    traceIdMiddleware(request, response, next);

    expect(request.traceId).toBe(traceId);
    expect(response.setHeader).toHaveBeenCalledWith(TRACE_ID_HEADER, traceId);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
