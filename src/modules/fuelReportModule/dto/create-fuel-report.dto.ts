import { IsDate, IsNumber, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFuelReportDto {
  @Type(() => Date)
  @IsDate()
  date: Date;

  @IsNumber()
  nafta: number;

  @IsNumber()
  litra: number;

  @IsString()
  bus: string;

  @IsString()
  driver: string;

  @IsString()
  employee: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  agency?: string;
}
