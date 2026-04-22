import { Inject, Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { QUEUE_TOKEN } from './queue.token';

@Injectable()
export class QueueService {
  constructor(@Inject(QUEUE_TOKEN) private readonly queue: Queue) {}

  async addJob(name: string, data: unknown): Promise<void> {
    await this.queue.add(name, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });
  }
}
