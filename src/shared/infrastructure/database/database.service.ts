/**
 * 데이터베이스 연결을 관리하는 서비스.
 *
 * 앱 시작 시 `createDatabaseClient()`를 호출해 postgres 또는 sqlite 클라이언트를 초기화합니다.
 * `db` getter로 Drizzle ORM 인스턴스에 접근해 타입 안전한 쿼리를 작성할 수 있습니다.
 * `onApplicationShutdown`은 NestJS 생명주기 훅으로, 앱 종료 시 자동으로 DB 연결을 닫습니다.
 * DB 쿼리를 실행하려면 이 서비스를 주입받아 `this.databaseService.db`를 사용하세요.
 */
import { Injectable, type OnApplicationShutdown } from '@nestjs/common';

import { AppConfigService } from '../../../bootstrap/config/app-config.service';

import { createDatabaseClient } from './create-database-client';

/** DB 클라이언트 초기화·ping·종료를 담당하는 서비스 */
@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  readonly databaseClient;

  constructor(private readonly appConfigService: AppConfigService) {
    this.databaseClient = createDatabaseClient({
      databaseUrl: appConfigService.databaseUrl,
      driver: appConfigService.databaseDriver,
      postgresDatabase: appConfigService.postgresDb,
      postgresHost: appConfigService.postgresHost,
      postgresPassword: appConfigService.postgresPassword,
      postgresPort: appConfigService.postgresPort,
      postgresUser: appConfigService.postgresUser,
      sqlitePath: appConfigService.sqlitePath,
    });
  }

  /** 로우 레벨 DB 클라이언트(pg Pool 또는 better-sqlite3 Database)를 반환합니다. */
  get client() {
    return this.databaseClient.client;
  }

  /** Drizzle ORM 인스턴스를 반환합니다. 타입 안전한 쿼리 작성에 사용하세요. */
  get db() {
    return this.databaseClient.db;
  }

  /** 현재 사용 중인 DB 드라이버 이름('postgres' | 'sqlite')을 반환합니다. */
  get driver() {
    return this.databaseClient.driver;
  }

  /** `SELECT 1` 쿼리로 DB 연결이 살아있는지 확인합니다. */
  async ping() {
    if (this.databaseClient.driver === 'sqlite') {
      this.databaseClient.client.prepare('SELECT 1').get();

      return true;
    }

    await this.databaseClient.client.query('SELECT 1');

    return true;
  }

  /** 앱 종료 시 드라이버에 따라 적절한 방식으로 DB 연결을 닫습니다. */
  async onApplicationShutdown() {
    if (this.databaseClient.driver === 'sqlite') {
      this.databaseClient.client.close();

      return;
    }

    await this.databaseClient.client.end();
  }
}
