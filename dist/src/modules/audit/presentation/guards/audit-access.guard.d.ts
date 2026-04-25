import { type CanActivate, type ExecutionContext } from "@nestjs/common";
export declare class AuditAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean;
}
