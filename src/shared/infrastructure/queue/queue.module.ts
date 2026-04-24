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
        if (!url) {
          return {
            add: async () => undefined,
            isPaused: async () => false,
          } as unknown as Queue;
        }
        const connection = new Redis(url);
        return new Queue(EMAIL_QUEUE, { connection });
      },
      inject: [ConfigService],
    },
    QueueService,
  ],
  exports: [QUEUE_TOKEN, QueueService],
})
export class QueueModule {}
