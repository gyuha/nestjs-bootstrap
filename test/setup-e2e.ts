process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= './test-e2e.sqlite';
process.env.JWT_SECRET ??= 'test-secret-key-that-is-at-least-32-chars';
process.env.EMAIL_PROVIDER ??= 'log';
process.env.STORAGE_PROVIDER ??= 'local';
process.env.STORAGE_LOCAL_PATH ??= './test-uploads';
