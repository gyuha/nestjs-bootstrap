import { Injectable, type CanActivate, type ExecutionContext } from "@nestjs/common";
import { Role } from "../../../../modules/users/domain/value-objects/role.value-object";

@Injectable()
export class AuditAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return false;

    // ADMINs can access all logs - no filtering
    if (user.role === Role.ADMIN) return true;

    // REGULAR users can only see their own logs
    // Inject userId filter into query params
    if (!request.query.userId || request.query.userId !== user.id) {
      request.query.userId = user.id;
    }

    return true;
  }
}
