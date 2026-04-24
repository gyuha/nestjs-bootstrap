import { Test } from '@nestjs/testing';
import { DRIZZLE_CLIENT } from '../../shared/infrastructure/database/database.token';
import { ImageService } from '../../shared/infrastructure/image/image.service';
import { StorageService } from '../../shared/infrastructure/storage/storage.service';
import { FilesService } from './files.service';

describe('FilesService', () => {
  let service: FilesService;
  let mockDb: { insert: jest.Mock; select: jest.Mock; delete: jest.Mock };
  let mockStorage: { upload: jest.Mock; delete: jest.Mock; getUrl: jest.Mock };
  let mockImage: { resize: jest.Mock };

  beforeEach(async () => {
    mockDb = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    };
    mockStorage = {
      upload: jest.fn().mockResolvedValue('/uploads/test.png'),
      delete: jest.fn().mockResolvedValue(undefined),
      getUrl: jest.fn().mockReturnValue('/uploads/test.png'),
    };
    mockImage = {
      resize: jest.fn().mockResolvedValue(Buffer.from('resized')),
    };

    const module = await Test.createTestingModule({
      providers: [
        FilesService,
        { provide: DRIZZLE_CLIENT, useValue: mockDb },
        { provide: StorageService, useValue: mockStorage },
        { provide: ImageService, useValue: mockImage },
      ],
    }).compile();

    service = module.get(FilesService);
  });

  describe('uploadFile()', () => {
    it('uploads and stores file metadata', async () => {
      const file = {
        originalname: 'test.png',
        mimetype: 'image/png',
        size: 1024,
        buffer: Buffer.from('data'),
      } as Express.Multer.File;

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            {
              id: 'file-uuid',
              userId: 'user-uuid',
              category: 'gallery',
              originalName: 'test.png',
              mimeType: 'image/png',
              size: 1024,
              url: '/uploads/gallery/user-uuid/file-uuid-original.png',
              thumbnailUrl:
                '/uploads/gallery/user-uuid/file-uuid-thumbnail.png',
              mediumUrl: '/uploads/gallery/user-uuid/file-uuid-medium.png',
              createdAt: new Date(),
            },
          ]),
        }),
      });

      const result = await service.uploadFile(file, 'user-uuid', 'gallery');

      expect(result.url).toBeDefined();
      expect(mockStorage.upload).toHaveBeenCalledTimes(3); // original + medium + thumbnail
      expect(mockImage.resize).toHaveBeenCalledTimes(2); // medium + thumbnail
    });

    it('rejects gallery upload when limit reached', async () => {
      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(Array(10).fill({})),
        }),
      });

      const file = {
        originalname: 'test.png',
        mimetype: 'image/png',
        size: 1024,
        buffer: Buffer.from('data'),
      } as Express.Multer.File;

      await expect(
        service.uploadFile(file, 'user-uuid', 'gallery'),
      ).rejects.toThrow('Gallery limit reached (max 10)');
    });
  });

  describe('findByIdForUser()', () => {
    it('returns the file when it belongs to the user', async () => {
      const record = { id: 'file-id', userId: 'user-id' };
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([record]),
          }),
        }),
      });

      await expect(service.findByIdForUser('file-id', 'user-id')).resolves.toBe(
        record,
      );
    });

    it('throws when the file belongs to another user', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest
              .fn()
              .mockResolvedValue([{ id: 'file-id', userId: 'other-user-id' }]),
          }),
        }),
      });

      await expect(
        service.findByIdForUser('file-id', 'user-id'),
      ).rejects.toThrow('Not your file');
    });
  });
});
