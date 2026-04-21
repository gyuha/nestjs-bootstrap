import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { Queue } from 'bullmq';
import { QUEUE_TOKEN } from './queue.token';
import { QueueService } from './queue.service';

export const EMAIL_QUEUE = 'email';

@Global()
@Module({
  providers: [
    {
      provide: QUEUE_TOKEN,
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('REDIS_URL');
        const connection = url ? new Redis(url) : new Redis();
        return new Queue(EMAIL_QUEUE, { connection });
      },
      inject: [ConfigService],
    },
    QueueService,
  ],
  exports: [QueueService],
})
export class QueueModule {}
