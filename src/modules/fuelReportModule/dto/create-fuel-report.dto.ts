import { IsDate, IsNumber, IsString } from 'class-validator';
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
}
