import { validatePassword } from '../../shared/utils/password.validation';

describe('validatePassword', () => {
  it('should reject password shorter than 8 characters', () => {
    const result = validatePassword('Abc1!');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters');
  });

  it('should reject password without lowercase letter', () => {
    const result = validatePassword('ABCDEFG1!');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one lowercase letter');
  });

  it('should reject password without uppercase letter', () => {
    const result = validatePassword('abcdefg1!');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one uppercase letter');
  });

  it('should reject password without number', () => {
    const result = validatePassword('Abcdefgh!');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one number');
  });

  it('should reject password without special character', () => {
    const result = validatePassword('Abcdefgh1');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one special character (@$!%*?&)');
  });

  it('should accept valid password meeting all criteria', () => {
    const result = validatePassword('Abcdefgh1!');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
