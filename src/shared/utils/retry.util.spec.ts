// src/shared/utils/retry.util.spec.ts
import { retry } from './retry.util';

describe('retry.util', () => {
  it('resolves immediately on first success', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    await expect(
      retry(fn, { attempts: 3, delayMs: 0, backoff: 'linear' }),
    ).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries and succeeds on second attempt', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');
    await expect(
      retry(fn, { attempts: 3, delayMs: 0, backoff: 'linear' }),
    ).resolves.toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws after max attempts', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('always fails'));
    await expect(
      retry(fn, { attempts: 3, delayMs: 0, backoff: 'linear' }),
    ).rejects.toThrow('always fails');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('uses default options when none provided', async () => {
    const fn = jest.fn().mockResolvedValue('default');
    await expect(retry(fn)).resolves.toBe('default');
  });
});
