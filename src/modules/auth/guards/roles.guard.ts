import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from '../../users/users.service';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as { userId: string };

    const userRoles = await this.usersService.getUserRoles(user.userId);
    const userPermissions = await this.usersService.getUserPermissions(
      user.userId,
    );

    const hasRole = requiredRoles.some((role) => userRoles.includes(role));
    const hasPermission = requiredRoles.some((perm) =>
      userPermissions.includes(perm),
    );

    if (!hasRole && !hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
