import { Role, UserStatus } from "../../domain/value-objects/role.value-object";
export declare class CreateUserDto {
  email: string;
  password: string;
  name: string;
  role?: Role;
}
export declare class UpdateUserDto {
  name?: string;
  role?: Role;
  status?: UserStatus;
}
export declare class UserResponseDto {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}
export declare class UserQueryDto {
  email?: string;
  role?: Role;
  status?: UserStatus;
  page?: number;
  limit?: number;
}
