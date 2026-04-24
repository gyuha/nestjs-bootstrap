import { createPaginationMeta, normalizePaginationQuery } from './pagination';

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

  it('calculates total pages from total and limit', () => {
    expect(createPaginationMeta({ page: 2, limit: 20, total: 95 })).toEqual({
      page: 2,
      limit: 20,
      total: 95,
      totalPages: 5,
    });
  });
});
