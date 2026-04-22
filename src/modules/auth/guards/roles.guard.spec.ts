import { type ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { UsersService } from '../../users/users.service';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let mockUsersService: {
    getUserRoles: jest.Mock;
    getUserPermissions: jest.Mock;
  };

  beforeEach(async () => {
    mockUsersService = {
      getUserRoles: jest.fn(),
      getUserPermissions: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        RolesGuard,
        { provide: Reflector, useValue: new Reflector() },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    guard = module.get(RolesGuard);
  });

  const createMockContext = (userId: string): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user: { userId } }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as ExecutionContext;

  it('allows access when no roles required', async () => {
    const context = createMockContext('user-1');
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('allows access when user has required role', async () => {
    mockUsersService.getUserRoles.mockResolvedValue(['admin']);
    mockUsersService.getUserPermissions.mockResolvedValue([]);
    const context = createMockContext('user-1');
    const reflector = guard.reflector;
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('denies access when user lacks required role', async () => {
    mockUsersService.getUserRoles.mockResolvedValue(['user']);
    mockUsersService.getUserPermissions.mockResolvedValue([]);
    const context = createMockContext('user-1');
    const reflector = guard.reflector;
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
