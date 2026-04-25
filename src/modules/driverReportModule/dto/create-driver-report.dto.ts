import { IsDate, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDriverReportDto {
  @Type(() => Date)
  @IsDate()
  date: Date;

  @IsNumber()
  promet: number;

  @IsNumber()
  nafta: number;

  @IsNumber()
  tur: number;

  @IsNumber()
  perqindja: number;

  @IsNumber()
  litra: number;

  @IsString()
  bus: string;

  @IsString()
  driver: string;

  @IsString()
  employee: string;
}
