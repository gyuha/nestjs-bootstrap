// src/shared/utils/uuid.util.spec.ts
import { generateUuid, isValidUuid } from './uuid.util';

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('uuid.util', () => {
  describe('generateUuid', () => {
    it('generates a UUID v4 string', () => {
      const uuid = generateUuid();
      expect(UUID_V4_PATTERN.test(uuid)).toBe(true);
    });

    it('generates unique values', () => {
      expect(generateUuid()).not.toBe(generateUuid());
    });
  });

  describe('isValidUuid', () => {
    it('returns true for valid UUID v4', () => {
      expect(isValidUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('returns false for invalid string', () => {
      expect(isValidUuid('not-a-uuid')).toBe(false);
      expect(isValidUuid('')).toBe(false);
    });
  });
});
