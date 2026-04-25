import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
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
  @ApiPropertyOptional({
    description: "Display name shown on the user profile.",
    example: "Jane Example",
    minLength: 1,
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  displayName?: string;

  @ApiPropertyOptional({
    description: "Absolute profile image URL. Send null to clear it.",
    example: "https://example.com/avatar.png",
    nullable: true,
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  avatarUrl?: string | null;

  @ApiPropertyOptional({
    description: "Short profile biography. Send null to clear it.",
    example: "Backend engineer.",
    maxLength: 500,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string | null;
}

export class ListUsersQueryDto implements ListUsersFilter {
  @ApiPropertyOptional({ description: "Page number, starting at 1.", example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    description: "Number of users per page.",
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({
    description: "Filter by account status.",
    enum: userStatuses,
    example: "active",
  })
  @IsOptional()
  @IsEnum(userStatuses)
  status?: UserStatus;

  @ApiPropertyOptional({
    description: "Filter by account role.",
    enum: userRoles,
    example: "ADMIN",
  })
  @IsOptional()
  @IsEnum(userRoles)
  role?: UserRole;

  @ApiPropertyOptional({
    description: "Case-insensitive search across email and display name.",
    example: "jane",
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}

export class CreateUserByAdminDto {
  @ApiProperty({
    description: "Unique account email address.",
    example: "admin-created@example.com",
    maxLength: 320,
  })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty({
    description: "Display name shown on the user profile.",
    example: "Admin Created",
    minLength: 1,
    maxLength: 120,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  displayName!: string;

  @ApiPropertyOptional({
    description: "Absolute profile image URL.",
    example: "https://example.com/avatar.png",
    nullable: true,
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  avatarUrl?: string | null;

  @ApiPropertyOptional({
    description: "Short profile biography.",
    example: "Invited through the admin API.",
    maxLength: 500,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string | null;

  @ApiPropertyOptional({ description: "Initial role.", enum: userRoles, example: "USER" })
  @IsOptional()
  @IsEnum(userRoles)
  role?: UserRole;

  @ApiPropertyOptional({
    description: "Initial account status.",
    enum: userStatuses,
    example: "active",
  })
  @IsOptional()
  @IsEnum(userStatuses)
  status?: UserStatus;
}

export class UpdateUserByAdminDto extends UpdateCurrentUserProfileDto {
  @ApiPropertyOptional({ description: "Updated role.", enum: userRoles, example: "ADMIN" })
  @IsOptional()
  @IsEnum(userRoles)
  role?: UserRole;

  @ApiPropertyOptional({
    description: "Updated account status.",
    enum: userStatuses,
    example: "inactive",
  })
  @IsOptional()
  @IsEnum(userStatuses)
  status?: UserStatus;
}

export class ChangeUserStatusDto {
  @ApiProperty({ description: "New account status.", enum: userStatuses, example: "inactive" })
  @IsEnum(userStatuses)
  status!: UserStatus;
}

export class ChangeUserRoleDto {
  @ApiProperty({ description: "New account role.", enum: userRoles, example: "ADMIN" })
  @IsEnum(userRoles)
  role!: UserRole;
}
