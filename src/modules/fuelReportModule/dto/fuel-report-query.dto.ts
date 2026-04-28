import { IsOptional, IsString } from 'class-validator';

export class FuelReportQueryDto {
  @IsOptional()
  @IsString()
  date_from?: string;

  @IsOptional()
  @IsString()
  date_to?: string;

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
