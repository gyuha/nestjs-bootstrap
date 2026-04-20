import { validateEnv } from './env.schema';

describe('validateEnv', () => {
  const validEnv = {
    NODE_ENV: 'development',
    PORT: '3000',
    DATABASE_URL: 'file:./dev.db',
    JWT_SECRET: 'a-secret-key-that-is-at-least-32-chars-long',
    ALLOWED_ORIGINS: 'http://localhost:3000',
  };

  it('returns parsed env when all required fields are valid', () => {
    const result = validateEnv(validEnv);
    expect(result.PORT).toBe(3000);
    expect(result.NODE_ENV).toBe('development');
    expect(result.DATABASE_URL).toBe('file:./dev.db');
  });

  it('coerces PORT string to number', () => {
    const result = validateEnv({ ...validEnv, PORT: '8080' });
    expect(result.PORT).toBe(8080);
  });

  it('applies default PORT of 3000 when PORT is omitted', () => {
    const { PORT: _PORT, ...rest } = validEnv;
    const result = validateEnv(rest);
    expect(result.PORT).toBe(3000);
  });

  it('throws when JWT_SECRET is shorter than 32 characters', () => {
    expect(() =>
      validateEnv({ ...validEnv, JWT_SECRET: 'too-short' }),
    ).toThrow('Environment validation failed');
  });

  it('throws when DATABASE_URL is missing', () => {
    const { DATABASE_URL: _DB, ...rest } = validEnv;
    expect(() => validateEnv(rest)).toThrow('Environment validation failed');
  });

  it('throws when NODE_ENV is not one of the allowed values', () => {
    expect(() =>
      validateEnv({ ...validEnv, NODE_ENV: 'staging' }),
    ).toThrow('Environment validation failed');
  });

  it('applies default ALLOWED_ORIGINS when omitted', () => {
    const { ALLOWED_ORIGINS: _AO, ...rest } = validEnv;
    const result = validateEnv(rest);
    expect(result.ALLOWED_ORIGINS).toBe('http://localhost:3000');
  });

  it('accepts a valid REDIS_URL when provided', () => {
    const result = validateEnv({ ...validEnv, REDIS_URL: 'redis://localhost:6379' });
    expect(result.REDIS_URL).toBe('redis://localhost:6379');
  });

  it('throws when REDIS_URL is provided but not a valid URL', () => {
    expect(() =>
      validateEnv({ ...validEnv, REDIS_URL: 'not-a-url' }),
    ).toThrow('Environment validation failed');
  });
});
