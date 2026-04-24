import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { S3Provider } from './s3.provider';

const mockSend = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: mockSend })),
  PutObjectCommand: jest.fn().mockImplementation((input: unknown) => input),
  DeleteObjectCommand: jest.fn().mockImplementation((input: unknown) => input),
}));

describe('S3Provider', () => {
  let provider: S3Provider;

  beforeEach(async () => {
    mockSend.mockReset();

    const module = await Test.createTestingModule({
      providers: [
        S3Provider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              const values: Record<string, string> = {
                AWS_S3_BUCKET: 'test-bucket',
                AWS_S3_REGION: 'ap-northeast-2',
                AWS_ACCESS_KEY_ID: 'key',
                AWS_SECRET_ACCESS_KEY: 'secret',
                AWS_S3_PUBLIC_URL: '',
              };
              return values[key];
            }),
            getOrThrow: jest.fn().mockImplementation((key: string) => {
              const values: Record<string, string> = {
                AWS_S3_BUCKET: 'test-bucket',
                AWS_S3_REGION: 'ap-northeast-2',
                AWS_ACCESS_KEY_ID: 'key',
                AWS_SECRET_ACCESS_KEY: 'secret',
              };
              if (values[key] === undefined) {
                throw new Error(`Config key "${key}" not found`);
              }
              return values[key];
            }),
          },
        },
      ],
    }).compile();

    provider = module.get(S3Provider);
  });

  describe('upload()', () => {
    it('uploads to S3 and returns URL', async () => {
      mockSend.mockResolvedValue({});

      const result = await provider.upload(
        'avatars/test.png',
        Buffer.from('data'),
        'image/png',
      );

      expect(mockSend).toHaveBeenCalled();
      expect(result).toContain('avatars/test.png');
    });
  });

  describe('delete()', () => {
    it('deletes from S3', async () => {
      mockSend.mockResolvedValue({});

      await provider.delete('avatars/test.png');

      expect(mockSend).toHaveBeenCalled();
    });
  });

  describe('getUrl()', () => {
    it('returns S3 URL', () => {
      const url = provider.getUrl('avatars/test.png');

      expect(url).toContain('test-bucket');
      expect(url).toContain('avatars/test.png');
    });
  });
});
