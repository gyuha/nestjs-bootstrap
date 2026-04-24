import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';
import { createPaginatedResult } from '../../application/pagination/pagination';
import { ResponseEnvelopeInterceptor } from './response-envelope.interceptor';

function createContext(traceId = 'trace-test-id'): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ traceId }),
    }),
  } as unknown as ExecutionContext;
}

function createHandler(value: unknown): CallHandler {
  return {
    handle: () => of(value),
  };
}

describe('ResponseEnvelopeInterceptor', () => {
  it('emits null data when handler returns undefined', async () => {
    const interceptor = new ResponseEnvelopeInterceptor();

    await expect(
      firstValueFrom(interceptor.intercept(createContext(), createHandler(undefined))),
    ).resolves.toEqual({
      data: null,
      meta: {
        traceId: 'trace-test-id',
      },
    });
  });

  it('preserves paginated response envelope shape', async () => {
    const interceptor = new ResponseEnvelopeInterceptor();
    const result = createPaginatedResult({
      items: [{ id: 1 }],
      page: 1,
      limit: 20,
      total: 1,
    });

    await expect(
      firstValueFrom(interceptor.intercept(createContext(), createHandler(result))),
    ).resolves.toEqual({
      data: [{ id: 1 }],
      meta: {
        traceId: 'trace-test-id',
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      },
    });
  });
});
