/**
 * better-sqlite3 모듈의 TypeScript 타입 선언 보강(augmentation) 파일.
 *
 * better-sqlite3는 자체 타입 선언이 이 프로젝트의 사용 패턴과 맞지 않아
 * 별도로 타입을 정의합니다. `declare module`로 해당 패키지의 타입을
 * 덮어쓰거나 보강할 수 있습니다.
 * 이 파일은 런타임에는 존재하지 않으며, TypeScript 컴파일 단계에서만 사용됩니다.
 */
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
