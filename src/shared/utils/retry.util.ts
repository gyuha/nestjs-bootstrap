// src/shared/utils/retry.util.ts
export interface RetryOptions {
  attempts: number;
  delayMs: number;
  backoff: 'linear' | 'exponential';
}

const DEFAULT_OPTIONS: RetryOptions = {
  attempts: 3,
  delayMs: 500,
  backoff: 'exponential',
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retry<T>(
  fn: () => Promise<T>,
  options?: Partial<RetryOptions>,
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < opts.attempts) {
        const delay =
          opts.backoff === 'exponential'
            ? opts.delayMs * 2 ** (attempt - 1)
            : opts.delayMs * attempt;
        await sleep(delay);
      }
    }
  }

  throw lastError;
}
