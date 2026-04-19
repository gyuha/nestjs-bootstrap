import { Database } from 'bun:sqlite';
import { Pool } from 'pg';

import {
  DEFAULT_DATABASE_URL,
  SQLITE_FILE_URL_PREFIX,
} from '../../src/shared/infrastructure/database/database.constants';

function getStringEnv(name: string, fallback = '') {
  return process.env[name] ?? fallback;
}

function getPostgresPool(databaseUrl: string) {
  if (databaseUrl.length > 0) {
    return new Pool({ connectionString: databaseUrl });
  }

  return new Pool({
    database: getStringEnv('POSTGRES_DB', 'app'),
    host: getStringEnv('POSTGRES_HOST', 'localhost'),
    password: getStringEnv('POSTGRES_PASSWORD', 'postgres'),
    port: Number(getStringEnv('POSTGRES_PORT', '5432')),
    user: getStringEnv('POSTGRES_USER', 'postgres'),
  });
}

async function main() {
  const driver = process.env.DB_DRIVER === 'postgres' ? 'postgres' : 'sqlite';
  const databaseUrl = getStringEnv('DATABASE_URL', '');
  const sqlitePath = getStringEnv('SQLITE_PATH', DEFAULT_DATABASE_URL);
  const seededAt = Date.now();
  const details = {
    cache: false,
    database: true,
    seededAt: new Date(seededAt).toISOString(),
  };

  if (driver === 'postgres') {
    const client = getPostgresPool(databaseUrl);

    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS health_snapshots (
          created_at integer NOT NULL,
          details jsonb NOT NULL,
          id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          status text NOT NULL
        )
      `);
      await client.query(
        'INSERT INTO health_snapshots (created_at, details, status) VALUES ($1, $2::jsonb, $3)',
        [seededAt, JSON.stringify(details), 'seeded'],
      );

      const result = await client.query<{ count: number }>(
        'SELECT COUNT(*)::int AS count FROM health_snapshots',
      );

      console.log(
        `Seeded health_snapshots (${result.rows[0]?.count ?? 0} rows total)`,
      );
    } finally {
      await client.end();
    }

    return;
  }

  const resolvedSqlitePath = databaseUrl.startsWith(SQLITE_FILE_URL_PREFIX)
    ? databaseUrl.slice(SQLITE_FILE_URL_PREFIX.length)
    : databaseUrl || sqlitePath;
  const client = new Database(resolvedSqlitePath, { create: true });

  try {
    // Keep the bootstrap path aligned with the tracked SQLite schema in drizzle/schema/sqlite.ts.
    client.run(`
      CREATE TABLE IF NOT EXISTS health_snapshots (
        created_at integer NOT NULL,
        details text NOT NULL,
        id integer PRIMARY KEY AUTOINCREMENT,
        status text NOT NULL
      )
    `);

    client
      .query(
        'INSERT INTO health_snapshots (created_at, details, status) VALUES (?, ?, ?)',
      )
      .run(seededAt, JSON.stringify(details), 'seeded');

    const result = client
      .query('SELECT COUNT(*) AS count FROM health_snapshots')
      .get() as {
      count: number;
    };

    console.log(`Seeded health_snapshots (${result.count} rows total)`);
  } finally {
    client.close();
  }
}

await main();
