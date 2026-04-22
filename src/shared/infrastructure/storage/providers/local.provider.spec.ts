import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { LocalProvider } from './local.provider';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
    unlink: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('LocalProvider', () => {
  let provider: LocalProvider;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        LocalProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'STORAGE_LOCAL_PATH') return './test-uploads';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    provider = module.get(LocalProvider);
  });

  describe('upload()', () => {
    it('writes file to disk and returns URL path', async () => {
      const result = await provider.upload(
        'avatars/test.png',
        Buffer.from('data'),
        'image/png',
      );

      expect(fs.promises.writeFile).toHaveBeenCalled();
      expect(result).toContain('avatars/test.png');
    });
  });

  describe('delete()', () => {
    it('deletes file from disk', async () => {
      await provider.delete('avatars/test.png');

      expect(fs.promises.unlink).toHaveBeenCalled();
    });
  });

  describe('getUrl()', () => {
    it('returns a URL path for the key', () => {
      const url = provider.getUrl('avatars/test.png');

      expect(url).toContain('avatars/test.png');
    });
  });
});
