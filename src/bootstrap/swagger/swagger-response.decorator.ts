// src/bootstrap/swagger/swagger-response.decorator.ts
import { type Type, applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

/**
 * 단일 객체를 `{ success, data, timestamp }` 형태로 감싸는 Swagger 응답 스키마 데코레이터.
 * @param model 응답 `data` 필드에 사용할 DTO 클래스 타입
 * @returns 합성된 Swagger 데코레이터
 */
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

/**
 * 오프셋 기반 페이지네이션 목록을 `{ success, data[], meta, timestamp }` 형태로 감싸는 Swagger 응답 스키마 데코레이터.
 * @param model 응답 `data` 배열 요소에 사용할 DTO 클래스 타입
 * @returns 합성된 Swagger 데코레이터
 */
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

/**
 * 커서 기반 페이지네이션 목록을 `{ success, data[], meta, timestamp }` 형태로 감싸는 Swagger 응답 스키마 데코레이터.
 * @param model 응답 `data` 배열 요소에 사용할 DTO 클래스 타입
 * @returns 합성된 Swagger 데코레이터
 */
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
