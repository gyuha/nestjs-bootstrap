// src/shared/utils/pagination.util.ts
import type {
  CursorPaginatedResponse,
  OffsetPaginatedResponse,
} from '../dto/paginated-response.dto';
import type {
  CursorPaginationQuery,
  OffsetPaginationQuery,
} from '../dto/pagination.dto';

export function paginateOffset<T>(
  data: T[],
  total: number,
  query: OffsetPaginationQuery,
): OffsetPaginatedResponse<T> {
  const totalPages = total === 0 ? 0 : Math.ceil(total / query.limit);
  return {
    success: true,
    data,
    meta: { total, page: query.page, limit: query.limit, totalPages },
    timestamp: new Date().toISOString(),
  };
}

export function paginateCursor<T>(
  data: T[],
  nextCursor: string | null,
  _query: CursorPaginationQuery,
): CursorPaginatedResponse<T> {
  return {
    success: true,
    data,
    meta: { nextCursor, hasMore: nextCursor !== null },
    timestamp: new Date().toISOString(),
  };
}
