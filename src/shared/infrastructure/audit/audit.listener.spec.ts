import { Test } from '@nestjs/testing';
import { AuditListener } from './audit.listener';
import { AuditService } from './audit.service';

describe('AuditListener', () => {
  let listener: AuditListener;
  let mockAuditService: { log: jest.Mock };

  beforeEach(async () => {
    mockAuditService = { log: jest.fn().mockResolvedValue(undefined) };

    const module = await Test.createTestingModule({
      providers: [
        AuditListener,
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    listener = module.get(AuditListener);
  });

  it('logs auth.login event', async () => {
    await listener.handleLogin({
      userId: 'user-1',
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
    });

    expect(mockAuditService.log).toHaveBeenCalledWith({
      userId: 'user-1',
      action: 'auth.login',
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
    });
  });

  it('logs auth.logout event', async () => {
    await listener.handleLogout({ userId: 'user-1' });

    expect(mockAuditService.log).toHaveBeenCalledWith({
      userId: 'user-1',
      action: 'auth.logout',
    });
  });

  it('logs auth.password-changed event', async () => {
    await listener.handlePasswordChanged({ userId: 'user-1' });

    expect(mockAuditService.log).toHaveBeenCalledWith({
      userId: 'user-1',
      action: 'auth.password-changed',
    });
  });

  it('logs user.role-assigned event with metadata', async () => {
    await listener.handleRoleAssigned({ userId: 'user-1', roleId: 'role-1' });

    expect(mockAuditService.log).toHaveBeenCalledWith({
      userId: 'user-1',
      action: 'user.role-assigned',
      metadata: { roleId: 'role-1' },
    });
  });

  it('logs user.role-removed event with metadata', async () => {
    await listener.handleRoleRemoved({ userId: 'user-1', roleId: 'role-1' });

    expect(mockAuditService.log).toHaveBeenCalledWith({
      userId: 'user-1',
      action: 'user.role-removed',
      metadata: { roleId: 'role-1' },
    });
  });
});
