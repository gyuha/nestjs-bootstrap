import type { PaginationMeta } from '../../../application/pagination/pagination';

export type ApiResponseMeta = {
  traceId: string;
  pagination?: PaginationMeta;
};

export type ApiSuccessResponse<T> = {
  data: T;
  meta: ApiResponseMeta;
};

export type ApiErrorBody = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiErrorResponse = {
  error: ApiErrorBody;
  meta: ApiResponseMeta;
};
