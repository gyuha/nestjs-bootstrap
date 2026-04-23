import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Queue } from 'bullmq';
import { QUEUE_TOKEN } from '../../shared/infrastructure/queue/queue.token';

/**
 * Bull 큐 모니터링 대시보드(Bull Board)를 NestJS 앱에 마운트하는 설정 함수.
 * `BULL_BOARD_ENABLED` 환경변수가 `'true'`일 때만 `/admin/queues` 경로에 대시보드를 활성화한다.
 * @param app 설정 대상 NestJS 애플리케이션 인스턴스
 */
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
