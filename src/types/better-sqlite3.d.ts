declare module 'better-sqlite3' {
  export interface Options {
    fileMustExist?: boolean;
    nativeBinding?: string;
    readonly?: boolean;
    timeout?: number;
    verbose?: (...args: unknown[]) => void;
  }

  export interface RunResult {
    changes: number;
    lastInsertRowid: bigint | number;
  }

  export interface Statement {
    all(...params: unknown[]): unknown[];
    get(...params: unknown[]): unknown;
    run(...params: unknown[]): RunResult;
  }

  interface Database {
    readonly name: string;
    readonly open: boolean;
    close(): Database;
    prepare(source: string): Statement;
  }

  interface DatabaseConstructor {
    new (filename: string, options?: Options): Database;
  }

  const Database: DatabaseConstructor;

  export default Database;
}
