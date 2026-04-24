export type PaginationQuery = {
  page?: number | string;
  limit?: number | string;
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

function normalizePositiveInteger(value: number | string | undefined, fallback: number): number {
  const normalizedValue =
    typeof value === 'string' && /^-?\d+$/.test(value.trim()) ? Number(value) : value;

  if (typeof normalizedValue !== 'number' || !Number.isInteger(normalizedValue)) {
    return fallback;
  }

  return normalizedValue;
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

  if (!('items' in value) || !Array.isArray(value.items)) {
    return false;
  }

  if (!('pagination' in value) || !value.pagination || typeof value.pagination !== 'object') {
    return false;
  }

  return (
    'page' in value.pagination &&
    Number.isFinite(value.pagination.page) &&
    'limit' in value.pagination &&
    Number.isFinite(value.pagination.limit) &&
    'total' in value.pagination &&
    Number.isFinite(value.pagination.total) &&
    'totalPages' in value.pagination &&
    Number.isFinite(value.pagination.totalPages)
  );
}
