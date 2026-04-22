// src/shared/dto/paginated-response.dto.ts
export interface OffsetMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CursorMeta {
  nextCursor: string | null;
  hasMore: boolean;
}

export interface OffsetPaginatedResponse<T> {
  success: true;
  data: T[];
  meta: OffsetMeta;
  timestamp: string;
}

export interface CursorPaginatedResponse<T> {
  success: true;
  data: T[];
  meta: CursorMeta;
  timestamp: string;
}
