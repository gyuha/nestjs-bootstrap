import type { Config } from 'drizzle-kit';

const isProduction = process.env['NODE_ENV'] === 'production';

export default {
  dialect: isProduction ? 'postgresql' : 'sqlite',
  schema: './src/modules/**/schemas/*.schema.ts',
  out: './src/shared/infrastructure/database/migrations',
  dbCredentials: isProduction
    ? { url: process.env['DATABASE_URL'] as string }
    : { url: process.env['DATABASE_URL'] ?? 'file:./dev.db' },
} satisfies Config;
