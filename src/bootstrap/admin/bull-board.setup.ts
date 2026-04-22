import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Queue } from 'bullmq';
import { QUEUE_TOKEN } from '../../shared/infrastructure/queue/queue.token';

export function setupBullBoard(app: INestApplication): void {
  const config = app.get(ConfigService);
  const enabled = config.get<string>('BULL_BOARD_ENABLED');

  if (enabled !== 'true') return;

  const queue = app.get<Queue>(QUEUE_TOKEN);
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [new BullMQAdapter(queue)],
    serverAdapter,
  });

  app.use('/admin/queues', serverAdapter.getRouter());
}
