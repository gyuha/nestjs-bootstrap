// src/shared/presentation/filters/http-exception.filter.spec.ts
import type { ArgumentsHost } from '@nestjs/common';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => ({ status: mockStatus }),
        getRequest: () => ({}),
        getNext: () => ({}),
      }),
      getArgs: () => [],
      getArgByIndex: () => undefined,
      switchToRpc: () => ({ getData: () => ({}), getContext: () => ({}) }),
      switchToWs: () => ({ getData: () => ({}), getClient: () => ({}) }),
      getType: () => 'http' as const,
    } as unknown as ArgumentsHost;
  });

  it('formats NotFoundException with statusCode and timestamp', () => {
    filter.catch(new NotFoundException('Resource not found'), mockHost);

    expect(mockStatus).toHaveBeenCalledWith(404);
    const payload = mockJson.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.success).toBe(false);
    expect((payload.error as Record<string, unknown>).statusCode).toBe(404);
    expect((payload.error as Record<string, unknown>).message).toBe(
      'Resource not found',
    );
    expect(typeof payload.timestamp).toBe('string');
  });

  it('returns 500 for non-HTTP exceptions without exposing details', () => {
    filter.catch(new Error('Unexpected crash'), mockHost);

    expect(mockStatus).toHaveBeenCalledWith(500);
    const payload = mockJson.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.success).toBe(false);
    expect((payload.error as Record<string, unknown>).statusCode).toBe(500);
    expect((payload.error as Record<string, unknown>).message).toBe(
      'Internal server error',
    );
  });

  it('extracts details[] from ValidationPipe array message', () => {
    filter.catch(
      new BadRequestException({
        message: ['email must be an email', 'password is too short'],
        error: 'Bad Request',
        statusCode: 400,
      }),
      mockHost,
    );

    expect(mockStatus).toHaveBeenCalledWith(400);
    const payload = mockJson.mock.calls[0][0] as Record<string, unknown>;
    const error = payload.error as Record<string, unknown>;
    expect(error.message).toBe('Validation failed');
    expect(error.details).toEqual([
      'email must be an email',
      'password is too short',
    ]);
  });

  it('uses string message directly when not an array', () => {
    filter.catch(
      new HttpException({ message: 'Conflict' }, HttpStatus.CONFLICT),
      mockHost,
    );

    const payload = mockJson.mock.calls[0][0] as Record<string, unknown>;
    const error = payload.error as Record<string, unknown>;
    expect(error.message).toBe('Conflict');
    expect(error.details).toBeUndefined();
  });
});
