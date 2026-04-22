import { Test } from '@nestjs/testing';
import { QueueService } from './queue.service';
import { QUEUE_TOKEN } from './queue.token';

describe('QueueService', () => {
  let service: QueueService;
  let mockQueue: { add: jest.Mock };

  beforeEach(async () => {
    mockQueue = { add: jest.fn().mockResolvedValue({ id: '1' }) };

    const module = await Test.createTestingModule({
      providers: [QueueService, { provide: QUEUE_TOKEN, useValue: mockQueue }],
    }).compile();

    service = module.get(QueueService);
  });

  describe('addJob()', () => {
    it('adds job to the queue with retry config', async () => {
      const data = {
        type: 'signup-confirmation',
        to: 'test@example.com',
        token: 'abc',
      };

      await service.addJob('email', data);

      expect(mockQueue.add).toHaveBeenCalledWith('email', data, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      });
    });
  });
});
