import { IAgency } from './agency.types';
import { UserPermissions } from './permission.types';

export enum UserRoles {
  ADMIN = 'admin',
  USER = 'user',
}
export interface IUser {
  _id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  password: string;
  agency: IAgency;
  role: UserRoles;
  permissions?: UserPermissions[];
  createdAt: Date;
  updatedAt: Date;
}
