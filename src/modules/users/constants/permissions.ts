export const Permissions = {
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  USERS_DELETE: 'users:delete',
  ROLES_MANAGE: 'roles:manage',
  AUTH_ADMIN: 'auth:admin',
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];
