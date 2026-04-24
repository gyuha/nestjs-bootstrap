import { ErrorTrackingService } from './error-tracking.service';

/** ErrorTrackingService의 단위 테스트 스위트 */
describe('ErrorTrackingService', () => {
  let service: ErrorTrackingService;

  beforeEach(() => {
    service = new ErrorTrackingService();
  });

  it('starts with empty summary', () => {
    expect(service.getSummary()).toEqual({});
  });

  it('records a 4xx error in the histogram', () => {
    service.record({
      traceId: 't1',
      method: 'POST',
      path: '/auth/login',
      statusCode: 401,
      message: 'Unauthorized',
      timestamp: '2026-04-22T10:00:00.000Z',
      userId: null,
    });
    const summary = service.getSummary();
    expect(summary['401 POST /auth/login']).toBe(1);
  });

  it('records a 5xx error in the histogram', () => {
    service.record({
      traceId: 't2',
      method: 'GET',
      path: '/users',
      statusCode: 500,
      message: 'Internal server error',
      timestamp: '2026-04-22T10:00:00.000Z',
      userId: 'user-1',
      stack: 'Error: ...\n  at line 10',
    });
    expect(service.getSummary()['500 GET /users']).toBe(1);
  });

  it('accumulates counts for the same error type', () => {
    const ctx = {
      traceId: 't3',
      method: 'GET',
      path: '/health',
      statusCode: 404,
      message: 'Not found',
      timestamp: '2026-04-22T10:00:00.000Z',
      userId: null,
    };
    service.record(ctx);
    service.record(ctx);
    service.record(ctx);
    expect(service.getSummary()['404 GET /health']).toBe(3);
  });

  it('tracks multiple error types independently', () => {
    service.record({
      traceId: 't4',
      method: 'GET',
      path: '/a',
      statusCode: 404,
      message: 'Not found',
      timestamp: '2026-04-22T10:00:00.000Z',
      userId: null,
    });
    service.record({
      traceId: 't5',
      method: 'POST',
      path: '/b',
      statusCode: 500,
      message: 'Error',
      timestamp: '2026-04-22T10:00:00.000Z',
      userId: null,
    });
    const summary = service.getSummary();
    expect(summary['404 GET /a']).toBe(1);
    expect(summary['500 POST /b']).toBe(1);
  });
});
