import { Role, UserStatus } from '../value-objects/role.value-object';

export interface UserEntity {
  id: string;
  email: string;
  passwordHash: string | null;
  name: string;
  role: Role;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithOAuth {
  user: UserEntity;
  oauthProvider?: string;
  oauthProviderUserId?: string;
}