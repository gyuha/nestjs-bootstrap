import { defineConfig } from 'drizzle-kit';

const DEFAULT_DATABASE_MIGRATIONS_BASE_DIR = './drizzle/migrations';
const DEFAULT_POSTGRES_HOST = 'localhost';
const DEFAULT_POSTGRES_PORT = '5432';
const DEFAULT_POSTGRES_USER = 'postgres';
const DEFAULT_POSTGRES_PASSWORD = 'postgres';
const DEFAULT_POSTGRES_DB = 'app';
const DEFAULT_SQLITE_PATH = './data/dev.sqlite';

export function resolveDrizzleDriver() {
  return process.env.DB_DRIVER === 'postgres' ? 'postgres' : 'sqlite';
}

export function resolveDatabaseUrl() {
  if (resolveDrizzleDriver() === 'postgres') {
    if (process.env.DATABASE_URL) {
      return process.env.DATABASE_URL;
    }

    const host = process.env.POSTGRES_HOST || DEFAULT_POSTGRES_HOST;
    const port = process.env.POSTGRES_PORT || DEFAULT_POSTGRES_PORT;
    const user = process.env.POSTGRES_USER || DEFAULT_POSTGRES_USER;
    const password = process.env.POSTGRES_PASSWORD || DEFAULT_POSTGRES_PASSWORD;
    const database = process.env.POSTGRES_DB || DEFAULT_POSTGRES_DB;

    return `postgres://${user}:${password}@${host}:${port}/${database}`;
  }

  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  return process.env.SQLITE_PATH || DEFAULT_SQLITE_PATH;
}

export function resolveDrizzleDialect() {
  return resolveDrizzleDriver() === 'postgres' ? 'postgresql' : 'sqlite';
}

export function resolveDrizzleSchema() {
  return resolveDrizzleDriver() === 'postgres'
    ? './drizzle/schema/postgres.ts'
    : './drizzle/schema/sqlite.ts';
}

export function resolveDrizzleOut() {
  if (process.env.DATABASE_MIGRATIONS_DIR) {
    return process.env.DATABASE_MIGRATIONS_DIR;
  }

  return `${DEFAULT_DATABASE_MIGRATIONS_BASE_DIR}/${resolveDrizzleDriver()}`;
}

export default defineConfig({
  dbCredentials: {
    url: resolveDatabaseUrl(),
  },
  dialect: resolveDrizzleDialect(),
  out: resolveDrizzleOut(),
  schema: resolveDrizzleSchema(),
});
