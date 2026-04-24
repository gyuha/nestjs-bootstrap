import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LocalProvider } from './providers/local.provider';
import { S3Provider } from './providers/s3.provider';
import { StorageService } from './storage.service';
import { STORAGE_PROVIDER } from './storage.token';

@Global()
@Module({
  providers: [
    {
      provide: STORAGE_PROVIDER,
      useFactory: (config: ConfigService) => {
        const provider = config.get<string>('STORAGE_PROVIDER') ?? 'local';
        if (provider === 's3') return new S3Provider(config);
        return new LocalProvider(config);
      },
      inject: [ConfigService],
    },
    StorageService,
  ],
  exports: [STORAGE_PROVIDER, StorageService],
})
export class StorageModule {}
