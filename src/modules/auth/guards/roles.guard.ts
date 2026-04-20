import { Injectable } from '@nestjs/common';
import type { CanActivate } from '@nestjs/common';

// Stub guard - will be properly implemented in Task 5 (RolesGuard)
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(): boolean {
    // TODO: implement roles-based access control
    return true;
  }
}
