import {
  createPaginatedResult,
  createPaginationMeta,
  isPaginatedResult,
  normalizePaginationQuery,
} from './pagination';

describe('pagination helpers', () => {
  it('uses default page and limit when query values are missing', () => {
    expect(normalizePaginationQuery({})).toEqual({
      page: 1,
      limit: 20,
    });
  });

  it('normalizes invalid page and limit to minimum values', () => {
    expect(normalizePaginationQuery({ page: 0, limit: 0 })).toEqual({
      page: 1,
      limit: 1,
    });
  });

  it('caps limit at the maximum value', () => {
    expect(normalizePaginationQuery({ page: 2, limit: 500 })).toEqual({
      page: 2,
      limit: 100,
    });
  });

  it('parses numeric string page and limit values', () => {
    expect(normalizePaginationQuery({ page: '2', limit: '50' })).toEqual({
      page: 2,
      limit: 50,
    });
  });

  it('calculates total pages from total and limit', () => {
    expect(createPaginationMeta({ page: 2, limit: 20, total: 95 })).toEqual({
      page: 2,
      limit: 20,
      total: 95,
      totalPages: 5,
    });
  });

  it('creates a paginated result with items and pagination metadata', () => {
    const items = [{ id: 'item-1' }, { id: 'item-2' }];

    expect(createPaginatedResult({ items, page: 2, limit: 20, total: 95 })).toEqual({
      items,
      pagination: {
        page: 2,
        limit: 20,
        total: 95,
        totalPages: 5,
      },
    });
  });

  it('returns true for a valid paginated result', () => {
    const result = createPaginatedResult({
      items: ['item-1'],
      page: 1,
      limit: 20,
      total: 1,
    });

    expect(isPaginatedResult(result)).toBe(true);
  });

  it('returns false when items is not an array', () => {
    expect(
      isPaginatedResult({
        items: 'not-an-array',
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      }),
    ).toBe(false);
  });

  it('returns false when pagination numeric fields are malformed', () => {
    expect(
      isPaginatedResult({
        items: [],
        pagination: {
          page: 1,
          limit: '20',
          total: 1,
          totalPages: 1,
        },
      }),
    ).toBe(false);
  });
});
