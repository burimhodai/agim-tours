import { IsArray, IsEnum, IsString } from 'class-validator';
import { UserPermissions } from '../types/permission.types';
import { UserRoles } from '../types/user.types';

export class createUserDTO {
  @IsString()
  email: string;

  @IsString()
  password: string;

  @IsArray()
  @IsEnum(UserPermissions, { each: true })
  permissions: UserPermissions[];

  @IsEnum(UserRoles)
  role: UserRoles;
}

export class LoginDto {
  @IsString()
  email: string;

  @IsString()
  password: string;
}
