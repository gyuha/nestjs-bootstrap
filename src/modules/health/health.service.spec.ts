import { Test } from '@nestjs/testing';
import { CacheService } from '../../shared/infrastructure/cache/cache.service';
import { DRIZZLE_CLIENT } from '../../shared/infrastructure/database/database.token';
import { QUEUE_TOKEN } from '../../shared/infrastructure/queue/queue.token';
import { REDIS_CLIENT } from '../../shared/infrastructure/redis/redis.provider';
import { STORAGE_PROVIDER } from '../../shared/infrastructure/storage/storage.token';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let mockDb: { run: jest.Mock };
  let mockCache: jest.Mocked<Pick<CacheService, 'set' | 'get' | 'del'>>;
  let mockRedis: { ping: jest.Mock };
  let mockQueue: { isPaused: jest.Mock };
  let mockStorage: { upload: jest.Mock; delete: jest.Mock; getUrl: jest.Mock };

  beforeEach(async () => {
    mockDb = { run: jest.fn().mockResolvedValue(undefined) };
    mockCache = {
      set: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue('1'),
      del: jest.fn().mockResolvedValue(undefined),
    };
    mockRedis = { ping: jest.fn().mockResolvedValue('PONG') };
    mockQueue = { isPaused: jest.fn().mockResolvedValue(false) };
    mockStorage = {
      upload: jest.fn().mockResolvedValue('health-key'),
      delete: jest.fn().mockResolvedValue(undefined),
      getUrl: jest.fn().mockReturnValue('http://localhost/health-check'),
    };

    const module = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: DRIZZLE_CLIENT, useValue: mockDb },
        { provide: CacheService, useValue: mockCache },
        { provide: REDIS_CLIENT, useValue: mockRedis },
        { provide: QUEUE_TOKEN, useValue: mockQueue },
        { provide: STORAGE_PROVIDER, useValue: mockStorage },
      ],
    }).compile();

    service = module.get(HealthService);
  });

  describe('checkDb()', () => {
    it('returns "ok" when DB query succeeds', async () => {
      mockDb.run.mockResolvedValue(undefined);
      const result = await service.checkDb();
      expect(result).toBe('ok');
    });

    it('returns "error" when DB query throws', async () => {
      mockDb.run.mockRejectedValue(new Error('connection refused'));
      const result = await service.checkDb();
      expect(result).toBe('error');
    });
  });

  describe('checkCache()', () => {
    it('returns "ok" when cache set/get/del succeeds', async () => {
      const result = await service.checkCache();
      expect(result).toBe('ok');
      expect(mockCache.set).toHaveBeenCalled();
      expect(mockCache.get).toHaveBeenCalled();
      expect(mockCache.del).toHaveBeenCalled();
    });

    it('returns "error" when cache set throws', async () => {
      mockCache.set.mockRejectedValue(new Error('redis down'));
      const result = await service.checkCache();
      expect(result).toBe('error');
    });
  });

  describe('checkRedis()', () => {
    it('returns "ok" when ping succeeds', async () => {
      expect(await service.checkRedis()).toBe('ok');
    });

    it('returns "error" when ping fails', async () => {
      mockRedis.ping.mockRejectedValue(new Error('no connection'));
      expect(await service.checkRedis()).toBe('error');
    });
  });

  describe('checkQueue()', () => {
    it('returns "ok" when queue is ready', async () => {
      expect(await service.checkQueue()).toBe('ok');
    });

    it('returns "error" when queue is not ready', async () => {
      mockQueue.isPaused.mockRejectedValue(new Error('queue down'));
      expect(await service.checkQueue()).toBe('error');
    });
  });

  describe('checkStorage()', () => {
    it('returns "ok" when upload/delete succeeds', async () => {
      expect(await service.checkStorage()).toBe('ok');
      expect(mockStorage.upload).toHaveBeenCalled();
      expect(mockStorage.delete).toHaveBeenCalled();
    });

    it('returns "error" when upload fails', async () => {
      mockStorage.upload.mockRejectedValue(new Error('storage down'));
      expect(await service.checkStorage()).toBe('error');
    });
  });
});
