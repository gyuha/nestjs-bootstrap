import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterWithPasswordDto {
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  displayName!: string;
}

export class LoginWithPasswordDto {
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  password!: string;
}

export class RefreshSessionDto {
  @IsString()
  @MinLength(1)
  refreshToken!: string;
}

export class LogoutSessionDto extends RefreshSessionDto {}
