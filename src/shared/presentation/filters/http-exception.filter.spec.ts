import { HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockHost: any;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => ({ status: mockStatus }),
      }),
    };
  });

  it('formats HttpException with correct HTTP status', () => {
    filter.catch(
      new NotFoundException('Resource not found'),
      mockHost,
    );

    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Resource not found' },
    });
  });

  it('returns 500 INTERNAL_SERVER_ERROR for non-HTTP exceptions', () => {
    filter.catch(new Error('Unexpected crash'), mockHost);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' },
    });
  });

  it('extracts message from HttpException object response', () => {
    filter.catch(
      new HttpException({ message: 'Validation failed' }, HttpStatus.BAD_REQUEST),
      mockHost,
    );

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ message: 'Validation failed' }),
      }),
    );
  });

  it('joins array message from ValidationPipe into a single string', () => {
    filter.catch(
      new HttpException(
        { message: ['field must not be empty', 'field must be a string'] },
        HttpStatus.BAD_REQUEST,
      ),
      mockHost,
    );

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'field must not be empty; field must be a string',
        }),
      }),
    );
  });
});
