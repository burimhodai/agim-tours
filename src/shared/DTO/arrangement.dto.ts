import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CurrencyTypes } from '../types/currency.types';
import { PaymentStatusTypes } from '../types/payment.types';
import { RoomTypes } from '../types/hotel.types';
import { PaymentChunkDto } from './payment-chunk.dto';
import { PlaneLuggageDto } from './plane.dto';

export class ArrangementRoomGroupDto {
  @IsString()
  @IsNotEmpty()
  group_id: string;

  @IsOptional()
  @IsString()
  room_type_id?: string;

  @IsOptional()
  @IsString()
  room_type_name?: string;

  @IsOptional()
  @IsString()
  room_number?: string;
}

export class ArrangementTravelerDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  @IsNotEmpty()
  first_name: string;

  @IsString()
  @IsNotEmpty()
  last_name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  passport_number?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  birthdate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  passport_expiry_date?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  passport_issue_date?: Date;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlaneLuggageDto)
  luggage?: PlaneLuggageDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlaneLuggageDto)
  return_luggage?: PlaneLuggageDto[];

  @IsOptional()
  @IsString()
  room_group_id?: string;

  @IsOptional()
  @IsEnum(RoomTypes)
  room_type?: RoomTypes;
}

export class CreateArrangementDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  destination: string;

  @Type(() => Date)
  @IsDate()
  start_date: Date;

  @Type(() => Date)
  @IsDate()
  end_date: Date;

  @IsOptional()
  @IsString()
  hotel_partner?: string;

  @IsString()
  @IsNotEmpty()
  hotel_name: string;

  @Type(() => Date)
  @IsDate()
  check_in_date: Date;

  @Type(() => Date)
  @IsDate()
  check_out_date: Date;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ArrangementRoomGroupDto)
  room_groups?: ArrangementRoomGroupDto[];

  @IsString()
  @IsNotEmpty()
  departure_location: string;

  @IsString()
  @IsNotEmpty()
  destination_location: string;

  @Type(() => Date)
  @IsDate()
  departure_date: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  return_date?: Date;

  @IsOptional()
  @IsString()
  route_number?: string;

  @IsOptional()
  @IsString()
  return_route_number?: string;

  @IsOptional()
  @IsString()
  operatorId?: string;

  @IsOptional()
  @IsString()
  operator?: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsEnum(CurrencyTypes)
  currency?: CurrencyTypes;

  @IsOptional()
  @IsEnum(PaymentStatusTypes)
  payment_status?: PaymentStatusTypes;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentChunkDto)
  payment_chunks?: PaymentChunkDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ArrangementTravelerDto)
  travelers: ArrangementTravelerDto[];

  @IsOptional()
  @IsString()
  agency?: string;

  @IsOptional()
  @IsString()
  employee?: string;
}

export class UpdateArrangementDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  destination?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  start_date?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  end_date?: Date;

  @IsOptional()
  @IsString()
  hotel_partner?: string;

  @IsOptional()
  @IsString()
  hotel_name?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  check_in_date?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  check_out_date?: Date;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ArrangementRoomGroupDto)
  room_groups?: ArrangementRoomGroupDto[];

  @IsOptional()
  @IsString()
  departure_location?: string;

  @IsOptional()
  @IsString()
  destination_location?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  departure_date?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  return_date?: Date;

  @IsOptional()
  @IsString()
  route_number?: string;

  @IsOptional()
  @IsString()
  return_route_number?: string;

  @IsOptional()
  @IsString()
  operatorId?: string;

  @IsOptional()
  @IsString()
  operator?: string;

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
  @Type(() => PaymentChunkDto)
  payment_chunks?: PaymentChunkDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ArrangementTravelerDto)
  travelers?: ArrangementTravelerDto[];
}

export class ArrangementQueryDto {
  @IsOptional()
  @IsString()
  destination?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  start_date_from?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  start_date_to?: Date;

  @IsOptional()
  @IsEnum(PaymentStatusTypes)
  payment_status?: PaymentStatusTypes;

  @IsOptional()
  @IsString()
  agency?: string;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsString()
  q?: string;
}
