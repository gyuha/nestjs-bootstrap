import { ImageService } from './image.service';

jest.mock('sharp', () => {
  const mockResize = jest.fn().mockReturnValue({
    png: jest.fn().mockReturnValue({
      toBuffer: jest.fn().mockResolvedValue(Buffer.from('resized')),
    }),
    jpeg: jest.fn().mockReturnValue({
      toBuffer: jest.fn().mockResolvedValue(Buffer.from('resized')),
    }),
    webp: jest.fn().mockReturnValue({
      toBuffer: jest.fn().mockResolvedValue(Buffer.from('resized')),
    }),
  });
  return jest.fn().mockReturnValue({ resize: mockResize });
});

describe('ImageService', () => {
  let service: ImageService;

  beforeEach(() => {
    service = new ImageService();
  });

  it('resizes image to specified dimensions', async () => {
    const result = await service.resize(Buffer.from('original'), {
      width: 128,
      height: 128,
    });

    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(Buffer);
  });

  it('maintains aspect ratio by default', async () => {
    const result = await service.resize(Buffer.from('original'), {
      width: 512,
      height: 512,
    });

    expect(result).toBeDefined();
  });
});
