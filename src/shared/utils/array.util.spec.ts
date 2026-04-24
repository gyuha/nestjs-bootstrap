// src/shared/utils/array.util.spec.ts
import { chunk, dedupe, flatten, groupBy } from './array.util';

describe('array.util', () => {
  describe('chunk', () => {
    it('splits array into chunks of given size', () => {
      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('returns one chunk when size >= length', () => {
      expect(chunk([1, 2], 5)).toEqual([[1, 2]]);
    });

    it('returns empty array for empty input', () => {
      expect(chunk([], 3)).toEqual([]);
    });
  });

  describe('dedupe', () => {
    it('removes primitives duplicates', () => {
      expect(dedupe([1, 2, 2, 3, 1])).toEqual([1, 2, 3]);
    });

    it('dedupes objects by key', () => {
      const items = [
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
        { id: 1, name: 'c' },
      ];
      expect(dedupe(items, 'id')).toEqual([
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
      ]);
    });
  });

  describe('groupBy', () => {
    it('groups objects by key', () => {
      const items = [
        { type: 'a', val: 1 },
        { type: 'b', val: 2 },
        { type: 'a', val: 3 },
      ];
      const result = groupBy(items, 'type');
      expect(result.a).toHaveLength(2);
      expect(result.b).toHaveLength(1);
    });
  });

  describe('flatten', () => {
    it('flattens nested array one level', () => {
      expect(flatten([[1, 2], [3, 4], [5]])).toEqual([1, 2, 3, 4, 5]);
    });

    it('returns empty for empty input', () => {
      expect(flatten([])).toEqual([]);
    });
  });
});
