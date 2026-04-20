import { Test } from '@nestjs/testing';
import { CacheService } from '../../shared/infrastructure/cache/cache.service';
import { DRIZZLE_CLIENT } from '../../shared/infrastructure/database/database.token';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let mockDb: { run: jest.Mock };
  let mockCache: jest.Mocked<Pick<CacheService, 'set' | 'get' | 'del'>>;

  beforeEach(async () => {
    mockDb = { run: jest.fn() };
    mockCache = {
      set: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue('1'),
      del: jest.fn().mockResolvedValue(undefined),
    };

    const module = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: DRIZZLE_CLIENT, useValue: mockDb },
        { provide: CacheService, useValue: mockCache },
      ],
    }).compile();

    service = module.get(HealthService);
  });

  describe('checkDb()', () => {
    it('returns "ok" when DB query succeeds', async () => {
      mockDb.run.mockReturnValue(undefined);
      const result = await service.checkDb();
      expect(result).toBe('ok');
    });

    it('returns "error" when DB query throws', async () => {
      mockDb.run.mockImplementation(() => {
        throw new Error('connection refused');
      });
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
});
