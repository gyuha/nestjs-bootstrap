// src/shared/utils/string.util.spec.ts
import {
  camelToSnake,
  capitalize,
  maskEmail,
  snakeToCamel,
  toSlug,
  truncate,
} from './string.util';

describe('string.util', () => {
  describe('toSlug', () => {
    it('converts spaces to hyphens and lowercases', () => {
      expect(toSlug('Hello World')).toBe('hello-world');
    });

    it('removes special characters', () => {
      expect(toSlug('Héllo! World?')).toBe('hllo-world');
    });

    it('collapses multiple hyphens', () => {
      expect(toSlug('hello   world')).toBe('hello-world');
    });
  });

  describe('truncate', () => {
    it('returns unchanged when within limit', () => {
      expect(truncate('hello', 10)).toBe('hello');
    });

    it('adds ellipsis when over limit', () => {
      expect(truncate('hello world', 8)).toBe('hello...');
    });

    it('handles exact boundary', () => {
      expect(truncate('hello', 5)).toBe('hello');
    });
  });

  describe('maskEmail', () => {
    it('masks local part after first character', () => {
      expect(maskEmail('john@example.com')).toBe('j***@example.com');
    });

    it('handles single-char local part', () => {
      expect(maskEmail('a@b.com')).toBe('a***@b.com');
    });
  });

  describe('capitalize', () => {
    it('capitalizes first letter', () => {
      expect(capitalize('hello world')).toBe('Hello world');
    });

    it('handles empty string', () => {
      expect(capitalize('')).toBe('');
    });
  });

  describe('camelToSnake', () => {
    it('converts camelCase to snake_case', () => {
      expect(camelToSnake('helloWorld')).toBe('hello_world');
      expect(camelToSnake('camelCaseString')).toBe('camel_case_string');
    });
  });

  describe('snakeToCamel', () => {
    it('converts snake_case to camelCase', () => {
      expect(snakeToCamel('hello_world')).toBe('helloWorld');
      expect(snakeToCamel('snake_case_string')).toBe('snakeCaseString');
    });
  });
});
