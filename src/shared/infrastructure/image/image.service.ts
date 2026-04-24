import { Injectable } from '@nestjs/common';
import sharp from 'sharp';

/** sharp 라이브러리를 사용하여 이미지 리사이즈 등 처리를 담당하는 서비스 */
@Injectable()
export class ImageService {
  /** 이미지 버퍼를 지정한 크기로 리사이즈하여 PNG 버퍼로 반환한다.
   * @param buffer 원본 이미지 버퍼
   * @param options 리사이즈 대상 너비와 높이
   * @returns 리사이즈된 PNG 이미지 버퍼
   */
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
