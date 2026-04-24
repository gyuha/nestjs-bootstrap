import { BadRequestException, HttpException } from '@nestjs/common';
import {
  ApplicationError,
  ApplicationErrorCategory,
} from '../../application/errors/application-error';
import { DomainError, DomainErrorCategory } from '../../domain/errors/domain-error';
import { HttpExceptionFilter } from './http-exception.filter';

type MockResponse = {
  statusCode?: number;
  body?: unknown;
  status: jest.Mock;
  json: jest.Mock;
};

function createHost(exception: unknown, traceId = 'trace-test-id') {
  const response: MockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockImplementation((body: unknown) => {
      response.body = body;
      return response;
    }),
  };

  const request = { traceId };

  const host = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  };

  new HttpExceptionFilter().catch(exception, host as never);

  return response;
}

describe('HttpExceptionFilter', () => {
  it('maps application errors by category', () => {
    const response = createHost(
      new ApplicationError({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Resource not found',
        category: ApplicationErrorCategory.NotFound,
      }),
    );

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.body).toEqual({
      error: {
        code: 'RESOURCE_NOT_FOUND',
        message: 'Resource not found',
      },
      meta: {
        traceId: 'trace-test-id',
      },
    });
  });

  it('maps domain errors by category', () => {
    const response = createHost(
      new DomainError({
        code: 'EMAIL_ALREADY_USED',
        message: 'Email already used',
        category: DomainErrorCategory.Conflict,
      }),
    );

    expect(response.status).toHaveBeenCalledWith(409);
    expect(response.body).toEqual({
      error: {
        code: 'EMAIL_ALREADY_USED',
        message: 'Email already used',
      },
      meta: {
        traceId: 'trace-test-id',
      },
    });
  });

  it('keeps http exception status and standardizes body', () => {
    const response = createHost(new BadRequestException('Invalid request'));

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.body).toEqual({
      error: {
        code: 'BAD_REQUEST',
        message: 'Invalid request',
      },
      meta: {
        traceId: 'trace-test-id',
      },
    });
  });

  it('hides unknown error details', () => {
    const response = createHost(new Error('database password leaked'));

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.body).toEqual({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
      },
      meta: {
        traceId: 'trace-test-id',
      },
    });
  });

  it('uses validation code for class-validator bad request arrays', () => {
    const response = createHost(new HttpException(['name must be a string'], 400));

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: ['name must be a string'],
      },
      meta: {
        traceId: 'trace-test-id',
      },
    });
  });
});
