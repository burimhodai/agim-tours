import { IsDate, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class DriverReportQueryDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  date_from?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  date_to?: Date;

  @IsOptional()
  @IsString()
  bus?: string;

  @IsOptional()
  @IsString()
  driver?: string;

  @IsOptional()
  @IsString()
  agency?: string;
}
