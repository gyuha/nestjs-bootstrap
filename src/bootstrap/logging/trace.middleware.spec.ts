import type { NextFunction, Request, Response } from 'express';
import { TraceMiddleware, traceStore } from './trace.middleware';

type MockRequest = Partial<Request> & { headers: Record<string, string> };
type MockResponse = Partial<Response> & { setHeader: jest.Mock };

describe('TraceMiddleware', () => {
  let middleware: TraceMiddleware;

  beforeEach(() => {
    middleware = new TraceMiddleware();
  });

  it('passes through the X-Trace-Id header value if present', () => {
    const setHeader = jest.fn();
    const req: MockRequest = {
      headers: { 'x-trace-id': 'existing-trace-abc' },
    };
    const res: MockResponse = { setHeader };
    const next = jest.fn();

    middleware.use(
      req as Request,
      res as unknown as Response,
      next as NextFunction,
    );

    expect(setHeader).toHaveBeenCalledWith('X-Trace-Id', 'existing-trace-abc');
    expect(next).toHaveBeenCalled();
  });

  it('generates a UUID v4 when X-Trace-Id header is absent', () => {
    const setHeader = jest.fn();
    const req: MockRequest = { headers: {} };
    const res: MockResponse = { setHeader };
    const next = jest.fn();

    middleware.use(
      req as Request,
      res as unknown as Response,
      next as NextFunction,
    );

    const [[headerName, traceId]] = setHeader.mock.calls;
    expect(headerName).toBe('X-Trace-Id');
    expect(traceId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(next).toHaveBeenCalled();
  });

  it('calls next() in both cases', () => {
    const next = jest.fn();
    const req: MockRequest = { headers: {} };
    const res: MockResponse = { setHeader: jest.fn() };

    middleware.use(
      req as Request,
      res as unknown as Response,
      next as NextFunction,
    );

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('runs next() inside the traceStore context with the correct traceId', () => {
    const req: MockRequest = { headers: { 'x-trace-id': 'context-test-id' } };
    const res: MockResponse = { setHeader: jest.fn() };
    let capturedStore: { traceId: string } | undefined;
    const next = jest.fn().mockImplementation(() => {
      capturedStore = traceStore.getStore();
    });

    middleware.use(
      req as Request,
      res as unknown as Response,
      next as NextFunction,
    );

    expect(capturedStore).toEqual({ traceId: 'context-test-id' });
  });
});
