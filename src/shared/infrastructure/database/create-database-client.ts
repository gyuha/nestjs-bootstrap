/**
 * 설정에 따라 postgres 또는 sqlite Drizzle ORM 클라이언트를 생성하는 팩토리 함수.
 *
 * `DB_DRIVER` 환경변수에 따라 분기하며, SQLite는 파일 기반이라 디렉터리가 없으면 자동 생성합니다.
 * postgres는 `DATABASE_URL`(Connection String) 또는 개별 접속 정보 중 하나를 사용합니다.
 * Drizzle ORM의 `db` 객체에는 스키마가 연결되어 타입 안전한 쿼리를 작성할 수 있습니다.
 * 새 DB 드라이버 지원이 필요하면 이 파일에 분기를 추가하고 `database.types.ts`에 타입을 정의하세요.
 */
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

// better-sqlite3는 ESM/CJS 혼용 환경에서 require()로 로드해야 타입이 올바르게 적용됩니다.
const BetterSqlite3 = require('better-sqlite3') as {
  new (filename: string): SqliteClient;
};

/** `DATABASE_URL` 또는 `SQLITE_PATH`에서 실제 파일 경로를 결정합니다. */
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

/** SQLite 파일 경로를 확인하고, 부모 디렉터리가 없으면 생성한 후 클라이언트를 반환합니다. */
function createSqliteDatabaseClient(
  options: CreateDatabaseClientOptions,
): SqliteDatabaseClient {
  const sqlitePath = resolveSqlitePath(options);

  // SQLite 파일의 부모 디렉터리가 없으면 자동으로 생성합니다.
  mkdirSync(dirname(sqlitePath), { recursive: true });

  const client = new BetterSqlite3(sqlitePath);

  return {
    client,
    db: drizzleSqlite(client, { schema: sqliteSchema }),
    driver: 'sqlite',
  };
}

/** CONNECTION_STRING 또는 개별 접속 정보로 PostgreSQL 커넥션 풀을 생성합니다. */
function createPostgresDatabaseClient(
  options: CreateDatabaseClientOptions,
): PostgresDatabaseClient {
  // DATABASE_URL이 있고 sqlite URL이 아니면 Connection String으로 연결합니다.
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

/** DB 드라이버 설정에 따라 sqlite 또는 postgres Drizzle 클라이언트를 생성합니다. */
export function createDatabaseClient(
  options: CreateDatabaseClientOptions,
): DatabaseClient {
  if (options.driver === 'sqlite') {
    return createSqliteDatabaseClient(options);
  }

  return createPostgresDatabaseClient(options);
}
