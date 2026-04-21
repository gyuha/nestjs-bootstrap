import { Inject, Injectable } from '@nestjs/common';
import { STORAGE_PROVIDER } from './storage.token';
import type { IStorageProvider } from './providers/storage-provider.interface';

@Injectable()
export class StorageService {
  constructor(
    @Inject(STORAGE_PROVIDER) private readonly provider: IStorageProvider,
  ) {}

  async upload(key: string, buffer: Buffer, mimeType: string): Promise<string> {
    return this.provider.upload(key, buffer, mimeType);
  }

  async delete(key: string): Promise<void> {
    return this.provider.delete(key);
  }

  getUrl(key: string): string {
    return this.provider.getUrl(key);
  }
}
