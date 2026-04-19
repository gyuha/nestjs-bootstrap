import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Pool } from 'pg';

import type * as postgresSchema from '../../../../drizzle/schema/postgres';
import type * as sqliteSchema from '../../../../drizzle/schema/sqlite';

import type { DATABASE_DRIVERS } from './database.constants';

export type DatabaseDriver = (typeof DATABASE_DRIVERS)[number];

export interface CreateDatabaseClientOptions {
  databaseUrl: string;
  driver: DatabaseDriver;
  postgresDatabase?: string;
  postgresHost?: string;
  postgresPassword: string;
  postgresPort?: number;
  postgresUser?: string;
  sqlitePath: string;
}

export interface SqliteStatement {
  all(...params: unknown[]): unknown[];
  get(...params: unknown[]): unknown;
  run(...params: unknown[]): {
    changes: number;
    lastInsertRowid: bigint | number;
  };
}

export interface SqliteClient {
  readonly name: string;
  close(): SqliteClient;
  prepare(source: string): SqliteStatement;
}

export interface SqliteDatabaseClient {
  client: SqliteClient;
  db: BetterSQLite3Database<typeof sqliteSchema>;
  driver: 'sqlite';
}

export interface PostgresDatabaseClient {
  client: Pool;
  db: NodePgDatabase<typeof postgresSchema>;
  driver: 'postgres';
}

export type DatabaseClient = PostgresDatabaseClient | SqliteDatabaseClient;
