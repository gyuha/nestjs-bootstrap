export type PaginationQuery = {
  page?: number;
  limit?: number;
};

export type NormalizedPaginationQuery = {
  page: number;
  limit: number;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResult<T> = {
  items: T[];
  pagination: PaginationMeta;
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MIN_PAGE = 1;
const MIN_LIMIT = 1;
const MAX_LIMIT = 100;

function normalizePositiveInteger(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    return fallback;
  }

  return value;
}

export function normalizePaginationQuery(query: PaginationQuery): NormalizedPaginationQuery {
  const page = Math.max(MIN_PAGE, normalizePositiveInteger(query.page, DEFAULT_PAGE));
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(MIN_LIMIT, normalizePositiveInteger(query.limit, DEFAULT_LIMIT)),
  );

  return { page, limit };
}

export function createPaginationMeta(input: {
  page: number;
  limit: number;
  total: number;
}): PaginationMeta {
  return {
    page: input.page,
    limit: input.limit,
    total: input.total,
    totalPages: Math.ceil(input.total / input.limit),
  };
}

export function createPaginatedResult<T>(input: {
  items: T[];
  page: number;
  limit: number;
  total: number;
}): PaginatedResult<T> {
  return {
    items: input.items,
    pagination: createPaginationMeta({
      page: input.page,
      limit: input.limit,
      total: input.total,
    }),
  };
}

export function isPaginatedResult<T>(value: unknown): value is PaginatedResult<T> {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return 'items' in value && 'pagination' in value;
}
