import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditService } from './audit.service';

/** 도메인 이벤트를 수신하여 AuditService에 감사 로그를 기록하는 이벤트 리스너 */
@Injectable()
export class AuditListener {
  constructor(private readonly auditService: AuditService) {}

  /** auth.login 이벤트를 처리하여 로그인 감사 로그를 기록한다.
   * @param payload 로그인 이벤트 페이로드 (userId, ip, userAgent)
   */
  @OnEvent('auth.login')
  async handleLogin(payload: {
    userId: string;
    ip: string;
    userAgent: string;
  }): Promise<void> {
    await this.auditService.log({
      userId: payload.userId,
      action: 'auth.login',
      ip: payload.ip,
      userAgent: payload.userAgent,
    });
  }

  /** auth.logout 이벤트를 처리하여 로그아웃 감사 로그를 기록한다.
   * @param payload 로그아웃 이벤트 페이로드 (userId)
   */
  @OnEvent('auth.logout')
  async handleLogout(payload: { userId: string }): Promise<void> {
    await this.auditService.log({
      userId: payload.userId,
      action: 'auth.logout',
    });
  }

  /** auth.password-changed 이벤트를 처리하여 비밀번호 변경 감사 로그를 기록한다.
   * @param payload 비밀번호 변경 이벤트 페이로드 (userId)
   */
  @OnEvent('auth.password-changed')
  async handlePasswordChanged(payload: { userId: string }): Promise<void> {
    await this.auditService.log({
      userId: payload.userId,
      action: 'auth.password-changed',
    });
  }

  /** user.role-assigned 이벤트를 처리하여 역할 할당 감사 로그를 기록한다.
   * @param payload 역할 할당 이벤트 페이로드 (userId, roleId)
   */
  @OnEvent('user.role-assigned')
  async handleRoleAssigned(payload: {
    userId: string;
    roleId: string;
  }): Promise<void> {
    await this.auditService.log({
      userId: payload.userId,
      action: 'user.role-assigned',
      metadata: { roleId: payload.roleId },
    });
  }

  /** user.role-removed 이벤트를 처리하여 역할 제거 감사 로그를 기록한다.
   * @param payload 역할 제거 이벤트 페이로드 (userId, roleId)
   */
  @OnEvent('user.role-removed')
  async handleRoleRemoved(payload: {
    userId: string;
    roleId: string;
  }): Promise<void> {
    await this.auditService.log({
      userId: payload.userId,
      action: 'user.role-removed',
      metadata: { roleId: payload.roleId },
    });
  }
}
