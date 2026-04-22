import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { QueueService } from './queue.service';
import { QUEUE_TOKEN } from './queue.token';

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
