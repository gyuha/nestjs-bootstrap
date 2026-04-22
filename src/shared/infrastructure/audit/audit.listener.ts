import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditService } from './audit.service';

@Injectable()
export class AuditListener {
  constructor(private readonly auditService: AuditService) {}

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

  @OnEvent('auth.logout')
  async handleLogout(payload: { userId: string }): Promise<void> {
    await this.auditService.log({
      userId: payload.userId,
      action: 'auth.logout',
    });
  }

  @OnEvent('auth.password-changed')
  async handlePasswordChanged(payload: { userId: string }): Promise<void> {
    await this.auditService.log({
      userId: payload.userId,
      action: 'auth.password-changed',
    });
  }

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
