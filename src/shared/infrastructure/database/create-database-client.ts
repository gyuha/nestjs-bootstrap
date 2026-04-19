import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzlePostgres } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as postgresSchema from '../../../../drizzle/schema/postgres';
import * as sqliteSchema from '../../../../drizzle/schema/sqlite';

import {
  DEFAULT_DATABASE_URL,
  SQLITE_FILE_URL_PREFIX,
} from './database.constants';
import type {
  CreateDatabaseClientOptions,
  DatabaseClient,
  PostgresDatabaseClient,
  SqliteClient,
  SqliteDatabaseClient,
} from './database.types';

const BetterSqlite3 = require('better-sqlite3') as {
  new (filename: string): SqliteClient;
};

function resolveSqlitePath({
  databaseUrl,
  sqlitePath,
}: Pick<CreateDatabaseClientOptions, 'databaseUrl' | 'sqlitePath'>) {
  if (databaseUrl.startsWith(SQLITE_FILE_URL_PREFIX)) {
    return databaseUrl.slice(SQLITE_FILE_URL_PREFIX.length);
  }

  if (databaseUrl.length > 0) {
    throw new Error('sqlite driver requires DATABASE_URL values to use file:');
  }

  if (sqlitePath.length > 0) {
    return sqlitePath;
  }

  return DEFAULT_DATABASE_URL;
}

function createSqliteDatabaseClient(
  options: CreateDatabaseClientOptions,
): SqliteDatabaseClient {
  const sqlitePath = resolveSqlitePath(options);

  mkdirSync(dirname(sqlitePath), { recursive: true });

  const client = new BetterSqlite3(sqlitePath);

  return {
    client,
    db: drizzleSqlite(client, { schema: sqliteSchema }),
    driver: 'sqlite',
  };
}

function createPostgresDatabaseClient(
  options: CreateDatabaseClientOptions,
): PostgresDatabaseClient {
  const connectionString =
    options.databaseUrl.length > 0 &&
    !options.databaseUrl.startsWith(SQLITE_FILE_URL_PREFIX)
      ? options.databaseUrl
      : undefined;

  const client = connectionString
    ? new Pool({ connectionString })
    : new Pool({
        database: options.postgresDatabase,
        host: options.postgresHost,
        password: options.postgresPassword,
        port: options.postgresPort,
        user: options.postgresUser,
      });

  return {
    client,
    db: drizzlePostgres(client, { schema: postgresSchema }),
    driver: 'postgres',
  };
}

export function createDatabaseClient(
  options: CreateDatabaseClientOptions,
): DatabaseClient {
  if (options.driver === 'sqlite') {
    return createSqliteDatabaseClient(options);
  }

  return createPostgresDatabaseClient(options);
}
