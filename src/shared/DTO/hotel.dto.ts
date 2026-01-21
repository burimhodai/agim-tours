import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReservationStatus, RoomTypes } from '../types/hotel.types';

export class CreateRoomTypeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(1)
  capacity: number;

  @IsString()
  agency: string;
}

export class UpdateRoomTypeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  capacity?: number;
}

export class RoomTypeQueryDto {
  @IsString()
  agency: string;
}

// ===================================
// PARTNER HOTEL DTOs
// ===================================

export class CreatePartnerHotelDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  contact_person?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsString()
  agency: string;
}

export class UpdatePartnerHotelDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  contact_person?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

// ===================================
// TRAVELER DTOs
// ===================================

export class TravelerDto {
  @IsString()
  full_name: string;

  @IsString()
  passport_number: string;

  @Type(() => Date)
  @IsDate()
  date_of_birth: Date;

  @IsString()
  place_of_birth: string;

  @IsOptional()
  @IsEnum(RoomTypes)
  room_type?: RoomTypes;

  @IsString()
  departure_place: string;

  @IsOptional()
  @IsBoolean()
  show_in_hotel_list?: boolean;

  @IsOptional()
  @IsBoolean()
  show_in_border_list?: boolean;

  @IsOptional()
  @IsBoolean()
  show_in_guide_list?: boolean;

  @IsOptional()
  @IsString()
  bus_assignment?: string;

  @IsOptional()
  @IsString()
  room_group_id?: string;
}

// ===================================
// ROOM GROUP DTOs
// ===================================

export class RoomGroupDto {
  @IsOptional()
  @IsString()
  _id?: string;

  @IsString()
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

// ===================================
// HOTEL RESERVATION DTOs
// ===================================

export class CreateHotelReservationDto {
  @IsString()
  hotel_booking_id: string;

  @IsString()
  hotel_partner: string;

  @IsString()
  hotel_name: string;

  @Type(() => Date)
  @IsDate()
  check_in_date: Date;

  @Type(() => Date)
  @IsDate()
  check_out_date: Date;

  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TravelerDto)
  travelers: TravelerDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoomGroupDto)
  room_groups?: RoomGroupDto[];

  @IsOptional()
  @IsString()
  employee?: string;

  @IsString()
  agency: string;
}

export class UpdateHotelReservationDto {
  @IsOptional()
  @IsString()
  hotel_booking_id?: string;

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
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TravelerDto)
  travelers?: TravelerDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoomGroupDto)
  room_groups?: RoomGroupDto[];
}

export class AddReservationLogDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  employee?: string;
}

export class HotelReservationQueryDto {
  @IsOptional()
  @IsString()
  hotel_name?: string;

  @IsOptional()
  @IsString()
  hotel_booking_id?: string;

  @IsOptional()
  @IsString()
  hotel_partner?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  check_in_from?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  check_in_to?: Date;

  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @IsOptional()
  @IsString()
  agency?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;
}

export class PartnerHotelQueryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_active?: boolean;

  @IsString()
  agency: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;
}
