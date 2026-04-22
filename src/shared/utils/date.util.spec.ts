// src/shared/utils/date.util.spec.ts
import {
  addDays,
  diffInDays,
  formatDate,
  isExpired,
  subtractDays,
  toISOString,
} from './date.util';

describe('date.util', () => {
  const base = new Date('2026-04-22T12:00:00.000Z');

  describe('formatDate', () => {
    it('formats YYYY-MM-DD', () => {
      expect(formatDate(base, 'YYYY-MM-DD')).toBe('2026-04-22');
    });

    it('formats DD/MM/YYYY', () => {
      expect(formatDate(base, 'DD/MM/YYYY')).toBe('22/04/2026');
    });

    it('formats HH:mm:ss', () => {
      const d = new Date('2026-04-22T09:05:03.000Z');
      expect(formatDate(d, 'HH:mm:ss')).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });
  });

  describe('addDays', () => {
    it('adds days', () => {
      const result = addDays(base, 3);
      expect(result.getUTCDate()).toBe(25);
    });
  });

  describe('subtractDays', () => {
    it('subtracts days', () => {
      const result = subtractDays(base, 2);
      expect(result.getUTCDate()).toBe(20);
    });
  });

  describe('isExpired', () => {
    it('returns true for past date', () => {
      expect(isExpired(new Date('2020-01-01'))).toBe(true);
    });

    it('returns false for future date', () => {
      expect(isExpired(new Date('2099-01-01'))).toBe(false);
    });
  });

  describe('diffInDays', () => {
    it('calculates day difference', () => {
      const a = new Date('2026-04-22');
      const b = new Date('2026-04-25');
      expect(diffInDays(a, b)).toBe(-3);
    });
  });

  describe('toISOString', () => {
    it('returns ISO string', () => {
      expect(toISOString(base)).toBe('2026-04-22T12:00:00.000Z');
    });
  });
});
