import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsDateString, IsEnum } from 'class-validator';
import { CurrencyTypes } from '../types/currency.types';

export class CreateAirportTransportDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  hour?: string;

  @IsString()
  @IsOptional()
  vehicle_name?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsEnum(CurrencyTypes)
  @IsOptional()
  currency?: CurrencyTypes;

  @IsBoolean()
  @IsOptional()
  is_paid?: boolean;

  @IsNumber()
  @IsOptional()
  number_of_people?: number;

  @IsString()
  @IsOptional()
  contact_nr?: string;

  @IsString()
  @IsOptional()
  contact_person_name?: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsString()
  @IsOptional()
  agency?: string;

  @IsString()
  @IsOptional()
  employee?: string;
}

export class UpdateAirportTransportDto extends CreateAirportTransportDto {}

export class AirportTransportQueryDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  agency?: string;
}
