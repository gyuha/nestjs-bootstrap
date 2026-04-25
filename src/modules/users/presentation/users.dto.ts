import { Type } from "class-transformer";
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import type { ListUsersFilter } from "../domain/user.repository";
import type { UserProfilePatch, UserRole, UserStatus } from "../domain/user.types";

const userRoles: UserRole[] = ["USER", "ADMIN"];
const userStatuses: UserStatus[] = ["active", "inactive"];

export class UpdateCurrentUserProfileDto implements UserProfilePatch {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  displayName?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  avatarUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string | null;
}

export class ListUsersQueryDto implements ListUsersFilter {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @IsOptional()
  @IsEnum(userStatuses)
  status?: UserStatus;

  @IsOptional()
  @IsEnum(userRoles)
  role?: UserRole;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}

export class CreateUserByAdminDto {
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  displayName!: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  avatarUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string | null;

  @IsOptional()
  @IsEnum(userRoles)
  role?: UserRole;

  @IsOptional()
  @IsEnum(userStatuses)
  status?: UserStatus;
}

export class UpdateUserByAdminDto extends UpdateCurrentUserProfileDto {
  @IsOptional()
  @IsEnum(userRoles)
  role?: UserRole;

  @IsOptional()
  @IsEnum(userStatuses)
  status?: UserStatus;
}

export class ChangeUserStatusDto {
  @IsEnum(userStatuses)
  status!: UserStatus;
}

export class ChangeUserRoleDto {
  @IsEnum(userRoles)
  role!: UserRole;
}
