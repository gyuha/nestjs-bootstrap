import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test } from '@nestjs/testing';
import type { Cache } from 'cache-manager';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;
  let mockCache: jest.Mocked<Pick<Cache, 'get' | 'set' | 'del'>>;

  beforeEach(async () => {
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        CacheService,
        { provide: CACHE_MANAGER, useValue: mockCache },
      ],
    }).compile();

    service = module.get(CacheService);
  });

  it('get() returns cached value when key exists', async () => {
    mockCache.get.mockResolvedValue({ id: 1 });
    const result = await service.get<{ id: number }>('key');
    expect(result).toEqual({ id: 1 });
    expect(mockCache.get).toHaveBeenCalledWith('key');
  });

  it('get() returns null when key does not exist', async () => {
    mockCache.get.mockResolvedValue(undefined);
    const result = await service.get('missing-key');
    expect(result).toBeNull();
  });

  it('set() stores value with default ttl', async () => {
    mockCache.set.mockResolvedValue(undefined);
    await service.set('key', { id: 1 });
    expect(mockCache.set).toHaveBeenCalledWith('key', { id: 1 }, undefined);
  });

  it('set() stores value with custom ttl', async () => {
    mockCache.set.mockResolvedValue(undefined);
    await service.set('key', 'value', 300);
    expect(mockCache.set).toHaveBeenCalledWith('key', 'value', 300);
  });

  it('del() removes the key', async () => {
    mockCache.del.mockResolvedValue(true);
    await service.del('key');
    expect(mockCache.del).toHaveBeenCalledWith('key');
  });
});
