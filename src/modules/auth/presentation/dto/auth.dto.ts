import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterWithPasswordDto {
  @ApiProperty({
    description: "Unique account email address.",
    example: "jane@example.com",
    maxLength: 320,
  })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty({
    description: "Password used for password-provider login.",
    example: "correct-horse-battery-staple",
    minLength: 8,
    maxLength: 200,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password!: string;

  @ApiProperty({
    description: "Display name shown on the user profile.",
    example: "Jane Example",
    minLength: 1,
    maxLength: 120,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  displayName!: string;
}

export class LoginWithPasswordDto {
  @ApiProperty({
    description: "Account email address.",
    example: "jane@example.com",
    maxLength: 320,
  })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty({
    description: "Password for the account.",
    example: "correct-horse-battery-staple",
    minLength: 1,
    maxLength: 200,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  password!: string;
}

export class RefreshSessionDto {
  @ApiProperty({
    description: "Opaque refresh token returned by register, login, or refresh.",
    example: "refresh-token",
  })
  @IsString()
  @MinLength(1)
  refreshToken!: string;
}

export class LogoutSessionDto extends RefreshSessionDto {}
