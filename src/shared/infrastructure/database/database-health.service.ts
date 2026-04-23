/**
 * 데이터베이스 연결 상태를 확인하는 헬스체크 서비스.
 *
 * `DatabaseService.ping()`을 호출해 DB가 응답하는지 확인합니다.
 * 예외 발생 시(연결 실패, 타임아웃 등) false를 반환해 헬스체크가 실패 처리되도록 합니다.
 * 헬스체크 판단 기준을 변경하거나 추가 검사 항목을 넣으려면 `isHealthy()`를 수정하세요.
 */
import { Injectable } from '@nestjs/common';

import { DatabaseService } from './database.service';

/** DB ping으로 데이터베이스 연결 상태를 확인하는 서비스 */
@Injectable()
export class DatabaseHealthService {
  constructor(private readonly databaseService: DatabaseService) {}

  /** DB가 SELECT 1에 응답하면 true, 실패하거나 예외 발생 시 false를 반환합니다. */
  async isHealthy() {
    try {
      return await this.databaseService.ping();
    } catch {
      return false;
    }
  }
}
