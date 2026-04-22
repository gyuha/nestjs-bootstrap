// src/shared/utils/pagination.util.spec.ts
import type { CursorPaginationQuery } from '../dto/pagination.dto';
import type { OffsetPaginationQuery } from '../dto/pagination.dto';
import { paginateCursor, paginateOffset } from './pagination.util';

describe('paginateOffset', () => {
  const query = { page: 2, limit: 10 } as OffsetPaginationQuery;

  it('returns success envelope with offset meta', () => {
    const result = paginateOffset(['a', 'b'], 25, query);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(['a', 'b']);
    expect(result.meta.total).toBe(25);
    expect(result.meta.page).toBe(2);
    expect(result.meta.limit).toBe(10);
    expect(result.meta.totalPages).toBe(3);
    expect(typeof result.timestamp).toBe('string');
  });

  it('calculates totalPages correctly when exactly divisible', () => {
    const q = { page: 1, limit: 5 } as OffsetPaginationQuery;
    expect(paginateOffset([], 10, q).meta.totalPages).toBe(2);
  });

  it('calculates totalPages = 0 when total is 0', () => {
    const q = { page: 1, limit: 20 } as OffsetPaginationQuery;
    expect(paginateOffset([], 0, q).meta.totalPages).toBe(0);
  });
});

describe('paginateCursor', () => {
  const query = { limit: 20 } as CursorPaginationQuery;

  it('returns success envelope with cursor meta', () => {
    const result = paginateCursor(['a'], 'cursor123', query);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(['a']);
    expect(result.meta.nextCursor).toBe('cursor123');
    expect(result.meta.hasMore).toBe(true);
    expect(typeof result.timestamp).toBe('string');
  });

  it('sets hasMore false when nextCursor is null', () => {
    const result = paginateCursor([], null, query);
    expect(result.meta.nextCursor).toBeNull();
    expect(result.meta.hasMore).toBe(false);
  });
});
