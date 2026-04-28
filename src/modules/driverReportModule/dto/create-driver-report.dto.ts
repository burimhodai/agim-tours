import { IsDate, IsNumber, IsString, IsBoolean, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDriverReportDto {
  @Type(() => Date)
  @IsDate()
  date: Date;

  @IsNumber()
  promet: number;

  @IsNumber()
  tur: number;

  @IsString()
  bus: string;

  @IsString()
  driver: string;

  @IsString()
  employee: string;

  @IsBoolean()
  @IsOptional()
  isExtraTur?: boolean;

  @IsString()
  @IsOptional()
  extraTurName?: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  agency?: string;
}
