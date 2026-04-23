/**
 * API 성공 응답을 일관된 형태로 감싸는 헬퍼 함수.
 *
 * 모든 엔드포인트가 `{ success: true, data: ..., meta: { traceId: ... } }` 형태로
 * 응답하도록 통일합니다. 클라이언트는 `success` 필드로 성공/실패를 판단할 수 있습니다.
 * 실패 응답은 `GlobalExceptionFilter`에서 동일한 구조로 처리됩니다.
 */

/** 성공 응답 데이터를 `{ success, data, meta }` 형태로 감쌉니다. */
export const createApiResponse = <TData>(
  data: TData,
  meta?: { traceId?: string },
) => ({
  success: true,
  data,
  meta,
});
