/**
 * 데이터베이스 클라이언트 관련 TypeScript 타입 정의.
 *
 * 이 프로젝트는 postgres와 sqlite 두 드라이버를 지원합니다.
 * `DatabaseClient` 유니온 타입을 통해 드라이버 종류에 따라 타입이 좁혀지므로
 * 컴파일 타임에 드라이버별 분기 처리를 안전하게 할 수 있습니다.
 * 새로운 DB 드라이버를 추가하려면 여기에 해당 클라이언트 인터페이스를 추가하세요.
 */
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Pool } from 'pg';

import type * as postgresSchema from '../../../../drizzle/schema/postgres';
import type * as sqliteSchema from '../../../../drizzle/schema/sqlite';

import type { DATABASE_DRIVERS } from './database.constants';

/** 지원 DB 드라이버의 리터럴 유니온 타입 ('postgres' | 'sqlite') */
export type DatabaseDriver = (typeof DATABASE_DRIVERS)[number];

/** `createDatabaseClient` 함수에 전달하는 옵션 타입 */
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

/** better-sqlite3의 `prepare().get/all/run` 반환 타입 */
export interface SqliteStatement {
  all(...params: unknown[]): unknown[];
  get(...params: unknown[]): unknown;
  run(...params: unknown[]): {
    changes: number;
    lastInsertRowid: bigint | number;
  };
}

/** better-sqlite3 데이터베이스 클라이언트 인터페이스 */
export interface SqliteClient {
  readonly name: string;
  close(): SqliteClient;
  prepare(source: string): SqliteStatement;
}

/** SQLite 드라이버용 클라이언트 묶음 타입 */
export interface SqliteDatabaseClient {
  client: SqliteClient;
  db: BetterSQLite3Database<typeof sqliteSchema>;
  driver: 'sqlite';
}

/** PostgreSQL 드라이버용 클라이언트 묶음 타입 */
export interface PostgresDatabaseClient {
  client: Pool;
  db: NodePgDatabase<typeof postgresSchema>;
  driver: 'postgres';
}

/** postgres 또는 sqlite 클라이언트를 통합하는 유니온 타입 */
export type DatabaseClient = PostgresDatabaseClient | SqliteDatabaseClient;
