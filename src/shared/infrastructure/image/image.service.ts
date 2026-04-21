import { Injectable } from '@nestjs/common';
import sharp from 'sharp';

@Injectable()
export class ImageService {
  async resize(
    buffer: Buffer,
    options: { width: number; height: number },
  ): Promise<Buffer> {
    return sharp(buffer)
      .resize(options.width, options.height, { fit: 'cover' })
      .png()
      .toBuffer();
  }
}
