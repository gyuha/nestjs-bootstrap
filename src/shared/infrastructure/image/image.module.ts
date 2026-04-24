import { Global, Module } from '@nestjs/common';
import { ImageService } from './image.service';

/** 이미지 처리 기능을 전역으로 제공하는 모듈 */
@Global()
@Module({
  providers: [ImageService],
  exports: [ImageService],
})
export class ImageModule {}
