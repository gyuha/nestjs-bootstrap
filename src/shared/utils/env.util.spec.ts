// src/shared/utils/env.util.spec.ts
import { getEnvOrDefault, requireEnv } from './env.util';

describe('env.util', () => {
  const ORIGINAL = process.env.TEST_KEY;

  afterEach(() => {
    if (ORIGINAL === undefined) {
      Reflect.deleteProperty(process.env, 'TEST_KEY');
    } else {
      process.env.TEST_KEY = ORIGINAL;
    }
  });

  describe('requireEnv', () => {
    it('returns the env value when present', () => {
      process.env.TEST_KEY = 'hello';
      expect(requireEnv('TEST_KEY')).toBe('hello');
    });

    it('throws when the key is missing', () => {
      Reflect.deleteProperty(process.env, 'TEST_KEY');
      expect(() => requireEnv('TEST_KEY')).toThrow(
        'Required environment variable TEST_KEY is not set',
      );
    });
  });

  describe('getEnvOrDefault', () => {
    it('returns the env value when present', () => {
      process.env.TEST_KEY = 'value';
      expect(getEnvOrDefault('TEST_KEY', 'fallback')).toBe('value');
    });

    it('returns fallback when key is missing', () => {
      Reflect.deleteProperty(process.env, 'TEST_KEY');
      expect(getEnvOrDefault('TEST_KEY', 'fallback')).toBe('fallback');
    });
  });
});
