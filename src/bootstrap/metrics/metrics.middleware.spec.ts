import { MetricsStore } from './metrics.store';
import { MetricsMiddleware } from './metrics.middleware';

describe('MetricsMiddleware', () => {
  let store: MetricsStore;
  let middleware: MetricsMiddleware;

  beforeEach(() => {
    store = new MetricsStore();
    middleware = new MetricsMiddleware(store);
  });

  afterEach(() => {
    store[Symbol.dispose]();
  });

  it('records method, status code, and duration on response finish', () => {
    const req = { method: 'GET' } as unknown as import('express').Request;
    const res = {
      on: (event: string, cb: () => void) => {
        if (event === 'finish') cb();
      },
      statusCode: 200,
    } as unknown as import('express').Response;
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(next).toHaveBeenCalled();
    const snap = store.snapshot();
    expect(snap.requests.total).toBe(1);
    expect(snap.requests.byStatus['200']).toBe(1);
    expect(snap.requests.byMethod['GET']).toBe(1);
  });

  it('captures 4xx status codes', () => {
    const req = { method: 'POST' } as unknown as import('express').Request;
    const res = {
      on: (event: string, cb: () => void) => {
        if (event === 'finish') cb();
      },
      statusCode: 400,
    } as unknown as import('express').Response;
    middleware.use(req, res, jest.fn());
    expect(store.snapshot().errors.client4xx).toBe(1);
  });

  it('captures 5xx status codes', () => {
    const req = { method: 'GET' } as unknown as import('express').Request;
    const res = {
      on: (event: string, cb: () => void) => {
        if (event === 'finish') cb();
      },
      statusCode: 500,
    } as unknown as import('express').Response;
    middleware.use(req, res, jest.fn());
    expect(store.snapshot().errors.server5xx).toBe(1);
  });

  it('does not record if response never finishes', () => {
    const req = { method: 'GET' } as unknown as import('express').Request;
    const res = {
      on: () => {},
      statusCode: 200,
    } as unknown as import('express').Response;
    middleware.use(req, res, jest.fn());
    expect(store.snapshot().requests.total).toBe(0);
  });
});
