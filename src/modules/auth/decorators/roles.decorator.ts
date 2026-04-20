import { SetMetadata } from '@nestjs/common';

// Stub decorator - will be properly implemented in Task 3 (AuthModule)
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
