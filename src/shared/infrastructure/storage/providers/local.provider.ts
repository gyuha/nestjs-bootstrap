import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import type { IStorageProvider } from './storage-provider.interface';

@Injectable()
export class LocalProvider implements IStorageProvider {
  private readonly basePath: string;
  private readonly logger = new Logger(LocalProvider.name);

  constructor(private readonly config: ConfigService) {
    this.basePath = this.config.get<string>('STORAGE_LOCAL_PATH') ?? './uploads';
  }

  async upload(key: string, buffer: Buffer, _mimeType: string): Promise<string> {
    const fullPath = path.join(this.basePath, key);
    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.promises.writeFile(fullPath, buffer);
    return `/uploads/${key}`;
  }

  async delete(key: string): Promise<void> {
    const fullPath = path.join(this.basePath, key);
    try {
      await fs.promises.unlink(fullPath);
    } catch {
      this.logger.warn(`File not found for deletion: ${key}`);
    }
  }

  getUrl(key: string): string {
    return `/uploads/${key}`;
  }
}
