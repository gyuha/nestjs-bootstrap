/**
 * class-validator 기반 전역 입력값 유효성 검사 파이프를 등록하는 함수.
 *
 * `ValidationPipe`는 DTO 클래스에 붙은 `@IsString()`, `@IsEmail()` 등의 데코레이터를
 * 기반으로 요청 바디·쿼리·파라미터를 자동으로 검증합니다.
 * - `whitelist: true`: DTO에 정의되지 않은 필드는 자동으로 제거합니다.
 * - `forbidNonWhitelisted: true`: 허용되지 않은 필드가 있으면 400 오류를 반환합니다.
 * - `transform: true`: 문자열로 들어온 값을 DTO의 타입에 맞게 자동 변환합니다.
 */
import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';

/** 전역 ValidationPipe를 등록해 모든 엔드포인트에 입력값 검증을 적용합니다. */
export function setupValidation(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
}
