// src/bootstrap/swagger/swagger-response.decorator.ts
import { type Type, applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

export function ApiWrappedResponse<T>(model: Type<T>) {
  return applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      schema: {
        properties: {
          success: { type: 'boolean', example: true },
          data: { $ref: getSchemaPath(model) },
          timestamp: { type: 'string', example: '2026-04-22T10:00:00.000Z' },
        },
      },
    }),
  );
}

export function ApiOffsetPaginatedResponse<T>(model: Type<T>) {
  return applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      schema: {
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'array', items: { $ref: getSchemaPath(model) } },
          meta: {
            type: 'object',
            properties: {
              total: { type: 'number' },
              page: { type: 'number' },
              limit: { type: 'number' },
              totalPages: { type: 'number' },
            },
          },
          timestamp: { type: 'string', example: '2026-04-22T10:00:00.000Z' },
        },
      },
    }),
  );
}

export function ApiCursorPaginatedResponse<T>(model: Type<T>) {
  return applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      schema: {
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'array', items: { $ref: getSchemaPath(model) } },
          meta: {
            type: 'object',
            properties: {
              nextCursor: { type: 'string', nullable: true },
              hasMore: { type: 'boolean' },
            },
          },
          timestamp: { type: 'string', example: '2026-04-22T10:00:00.000Z' },
        },
      },
    }),
  );
}
