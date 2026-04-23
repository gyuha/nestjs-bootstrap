/**
 * 요청 추적 ID(traceId)에 사용하는 HTTP 헤더명 상수.
 *
 * 문자열을 직접 사용하면 여러 파일에서 오타가 발생할 수 있습니다.
 * 상수로 분리하면 IDE 자동완성을 활용할 수 있고, 헤더명 변경 시 이 파일만 수정하면 됩니다.
 */

/** 요청·응답에 traceId를 전달하는 HTTP 헤더명 */
export const TRACE_ID_HEADER = 'x-trace-id';
