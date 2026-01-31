import {
  IsString,
  IsOptional,
  IsDate,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CurrencyTypes } from '../types/currency.types';
import { PaymentStatusTypes } from '../types/payment.types';

export class EventStartDto {
  @IsString()
  location: string;

  @IsString()
  time: string;
}

// Organized Travel Traveler DTO (without hotel fields)
export class OrganizedTravelerDto {
  @IsOptional()
  @IsString()
  _id?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  group_id?: string;

  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  passport_number?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  date_of_birth?: Date;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  paid_amount?: number;

  @IsOptional()
  @IsEnum(CurrencyTypes)
  currency?: CurrencyTypes;

  @IsOptional()
  @IsEnum(PaymentStatusTypes)
  payment_status?: PaymentStatusTypes;

  @IsOptional()
  @IsBoolean()
  show_in_border_list?: boolean;

  @IsOptional()
  @IsBoolean()
  show_in_guide_list?: boolean;

  @IsOptional()
  @IsString()
  bus?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  pickup_location?: string;

  @IsOptional()
  @IsString()
  pickup_time?: string;

  @IsOptional()
  @IsString()
  agency?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

// Print Columns DTO for Organized Travel
export class OrganizedPrintColumnsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  border_list?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  guide_list?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  bus_list?: string[];
}

// Create Organized Travel DTO
export class CreateOrganizedTravelDto {
  @IsString()
  name: string;

  @IsString()
  location: string;

  @Type(() => Date)
  @IsDate()
  date: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  return_date?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  check_in_date?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  check_out_date?: Date;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsEnum(CurrencyTypes)
  currency?: CurrencyTypes;

  @IsOptional()
  @IsEnum(PaymentStatusTypes)
  payment_status?: PaymentStatusTypes;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrganizedTravelerDto)
  travelers?: OrganizedTravelerDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventStartDto)
  starts?: EventStartDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  buses?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => OrganizedPrintColumnsDto)
  print_columns?: OrganizedPrintColumnsDto;

  @IsOptional()
  @IsString()
  agency?: string;

  @IsOptional()
  @IsString()
  employee?: string;

  @IsOptional()
  @IsString()
  documentId?: string;
}

// Update Organized Travel DTO
export class UpdateOrganizedTravelDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  date?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  return_date?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  check_in_date?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  check_out_date?: Date;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsEnum(CurrencyTypes)
  currency?: CurrencyTypes;

  @IsOptional()
  @IsEnum(PaymentStatusTypes)
  payment_status?: PaymentStatusTypes;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrganizedTravelerDto)
  travelers?: OrganizedTravelerDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventStartDto)
  starts?: EventStartDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  buses?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => OrganizedPrintColumnsDto)
  print_columns?: OrganizedPrintColumnsDto;

  @IsOptional()
  @IsString()
  agency?: string;

  @IsOptional()
  @IsString()
  employee?: string;

  @IsOptional()
  @IsString()
  documentId?: string;
}

// Add Travelers DTO
export class AddOrganizedTravelersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrganizedTravelerDto)
  travelers: OrganizedTravelerDto[];

  @IsOptional()
  @IsString()
  agency?: string;

  @IsOptional()
  @IsString()
  employee?: string;
}

// Assign Bus DTO
export class AssignOrganizedBusDto {
  @IsString()
  bus_id: string;

  @IsArray()
  @IsString({ each: true })
  traveler_ids: string[];

  @IsOptional()
  @IsString()
  employee?: string;
}

export class RefundItemDto {
  @IsString()
  traveler_id: string;

  @IsNumber()
  amount: number;

  @IsEnum(CurrencyTypes)
  currency: CurrencyTypes;
}

// Refund Traveler DTO
export class RefundOrganizedTravelerDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RefundItemDto)
  items: RefundItemDto[];

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  agency?: string;

  @IsOptional()
  @IsString()
  employee?: string;
}

// Query DTO
export class OrganizedTravelQueryDto {
  @IsOptional()
  @IsString()
  agency?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}
