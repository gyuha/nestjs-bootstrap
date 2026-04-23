/**
 * 데이터베이스 관련 상수 모음.
 *
 * `DATABASE_DRIVERS`: 지원하는 DB 드라이버 목록. 환경변수 검증과 드라이버 분기에 사용됩니다.
 * `DEFAULT_DATABASE_URL`: SQLite 경로가 지정되지 않았을 때 사용하는 기본 파일 경로입니다.
 * `SQLITE_FILE_URL_PREFIX`: `file:./path.sqlite` 형태의 URL 접두사로, DATABASE_URL이
 * SQLite를 가리키는지 구분하는 데 사용됩니다.
 */

/** 지원하는 데이터베이스 드라이버 목록 */
export const DATABASE_DRIVERS = ['postgres', 'sqlite'] as const;

/** SQLite 경로 미지정 시 사용하는 기본 데이터베이스 파일 경로 */
export const DEFAULT_DATABASE_URL = './data/dev.sqlite';

/** DATABASE_URL에서 SQLite 파일 경로를 나타내는 URL 접두사 */
export const SQLITE_FILE_URL_PREFIX = 'file:';
