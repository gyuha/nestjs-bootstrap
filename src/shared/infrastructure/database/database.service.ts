import { Injectable, type OnApplicationShutdown } from '@nestjs/common';

import { AppConfigService } from '../../../bootstrap/config/app-config.service';

import { createDatabaseClient } from './create-database-client';

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

  get client() {
    return this.databaseClient.client;
  }

  get db() {
    return this.databaseClient.db;
  }

  get driver() {
    return this.databaseClient.driver;
  }

  async ping() {
    if (this.databaseClient.driver === 'sqlite') {
      this.databaseClient.client.prepare('SELECT 1').get();

      return true;
    }

    await this.databaseClient.client.query('SELECT 1');

    return true;
  }

  async onApplicationShutdown() {
    if (this.databaseClient.driver === 'sqlite') {
      this.databaseClient.client.close();

      return;
    }

    await this.databaseClient.client.end();
  }
}
