import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisProvider, REDIS_CLIENT } from './redis.provider';

describe('RedisProvider', () => {
  it('provides a Redis client', async () => {
    const module = await Test.createTestingModule({
      providers: [
        RedisProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(undefined),
            getOrThrow: jest.fn().mockReturnValue('redis://localhost:6379'),
          },
        },
      ],
    }).compile();

    const redis = module.get(REDIS_CLIENT);
    expect(redis).toBeDefined();
    expect(typeof redis.get).toBe('function');
    expect(typeof redis.setex).toBe('function');
    expect(typeof redis.del).toBe('function');
  });
});
