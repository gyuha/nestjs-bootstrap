/**
 * 환경변수를 읽어 Zod 스키마로 파싱하는 함수.
 *
 * `ConfigModule.forRoot({ load: [loadAppConfig] })`에 전달되어 앱 시작 시 한 번 실행됩니다.
 * 파싱에 실패하면 에러를 던져 앱 실행을 즉시 중단시킵니다.
 * 이 동작 덕분에 잘못된 환경변수 설정으로 앱이 반쯤 실행되는 상황을 막을 수 있습니다.
 */
import { appConfigSchema } from './app-config.schema';

/** `process.env`를 파싱해 검증된 설정 객체를 반환합니다. 검증 실패 시 예외를 발생시킵니다. */
export const loadAppConfig = () => {
  const parsed = appConfigSchema.safeParse(process.env);

  if (!parsed.success) {
    throw new Error(
      `Invalid environment configuration: ${parsed.error.message}`,
    );
  }

  return parsed.data;
};
