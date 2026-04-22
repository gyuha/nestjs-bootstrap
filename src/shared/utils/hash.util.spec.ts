// src/shared/utils/hash.util.spec.ts
import { hashPassword, verifyPassword } from './hash.util';

describe('hash.util', () => {
  it('hashPassword returns a non-empty string different from input', async () => {
    const hash = await hashPassword('secret123');
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
    expect(hash).not.toBe('secret123');
  });

  it('verifyPassword returns true for correct password', async () => {
    const hash = await hashPassword('myPassword!');
    expect(await verifyPassword('myPassword!', hash)).toBe(true);
  });

  it('verifyPassword returns false for wrong password', async () => {
    const hash = await hashPassword('correct');
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });
});
