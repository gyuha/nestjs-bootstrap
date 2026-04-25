import { type CanActivate, type ExecutionContext } from '@nestjs/common';
export declare const API_KEY = "api-key";
export declare class ApiKeyGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
}
