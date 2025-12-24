import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserPermissions } from '../types/permission.types';
import { UserRoles } from '../types/user.types';

export class createUserDTO {
  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsString()
  email: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  agency?: string;

  @IsArray()
  @IsEnum(UserPermissions, { each: true })
  permissions: UserPermissions[];

  @IsEnum(UserRoles)
  role: UserRoles;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  agency?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(UserPermissions, { each: true })
  permissions?: UserPermissions[];

  @IsOptional()
  @IsEnum(UserRoles)
  role?: UserRoles;
}

export class LoginDto {
  @IsString()
  email: string;

  @IsString()
  password: string;
}
