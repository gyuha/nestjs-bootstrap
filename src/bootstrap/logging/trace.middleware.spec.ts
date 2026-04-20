import { TraceMiddleware } from './trace.middleware';

describe('TraceMiddleware', () => {
  let middleware: TraceMiddleware;

  beforeEach(() => {
    middleware = new TraceMiddleware();
  });

  it('passes through the X-Trace-Id header value if present', () => {
    const setHeader = jest.fn();
    const req = { headers: { 'x-trace-id': 'existing-trace-abc' } } as any;
    const res = { setHeader } as any;
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(setHeader).toHaveBeenCalledWith('X-Trace-Id', 'existing-trace-abc');
    expect(next).toHaveBeenCalled();
  });

  it('generates a UUID v4 when X-Trace-Id header is absent', () => {
    const setHeader = jest.fn();
    const req = { headers: {} } as any;
    const res = { setHeader } as any;
    const next = jest.fn();

    middleware.use(req, res, next);

    const [[headerName, traceId]] = setHeader.mock.calls;
    expect(headerName).toBe('X-Trace-Id');
    expect(traceId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(next).toHaveBeenCalled();
  });

  it('calls next() in both cases', () => {
    const next = jest.fn();
    const req = { headers: {} } as any;
    const res = { setHeader: jest.fn() } as any;

    middleware.use(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
