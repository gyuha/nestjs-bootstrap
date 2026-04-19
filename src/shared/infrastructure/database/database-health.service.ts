import { Injectable } from '@nestjs/common';

import { DatabaseService } from './database.service';

@Injectable()
export class DatabaseHealthService {
  constructor(private readonly databaseService: DatabaseService) {}

  async isHealthy() {
    try {
      return await this.databaseService.ping();
    } catch {
      return false;
    }
  }
}
