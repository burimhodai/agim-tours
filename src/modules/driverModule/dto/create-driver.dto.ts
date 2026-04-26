import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateDriverDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
