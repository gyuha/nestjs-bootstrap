import { Injectable } from '@nestjs/common';
import type { CanActivate } from '@nestjs/common';

// Stub guard - will be properly implemented in Task 3 (AuthModule)
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(): boolean {
    // TODO: implement JWT validation
    return true;
  }
}
