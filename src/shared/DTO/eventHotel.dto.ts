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

// Event Bus DTOs
export class CreateEventBusDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    plates?: string;

    @IsOptional()
    @IsString()
    model?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    drivers?: string[];

    @IsOptional()
    @IsNumber()
    capacity?: number;

    @IsOptional()
    @IsString()
    agency?: string;
}

export class UpdateEventBusDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    plates?: string;

    @IsOptional()
    @IsString()
    model?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    drivers?: string[];

    @IsOptional()
    @IsNumber()
    capacity?: number;
}

// Event Traveler DTO
export class EventTravelerDto {
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
    room_type?: string;

    @IsOptional()
    @IsString()
    hotel?: string;

    @IsOptional()
    @IsString()
    bus?: string;

    @IsOptional()
    @IsString()
    room_group_id?: string;

    @IsOptional()
    @IsString()
    note?: string;
}

export class RoomGroupDto {
    @IsString()
    group_id: string;

    @IsOptional()
    @IsString()
    room_type?: string;

    @IsOptional()
    @IsString()
    hotel?: string;

    @IsOptional()
    @IsString()
    room_number?: string;
}

// Print Columns DTO
export class PrintColumnsDto {
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    hotel_list?: string[];

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

// Create Event DTO
export class CreateEventDto {
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
    @Type(() => EventTravelerDto)
    travelers?: EventTravelerDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RoomGroupDto)
    room_groups?: RoomGroupDto[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    buses?: string[];

    @IsOptional()
    @IsString()
    hotel?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => PrintColumnsDto)
    print_columns?: PrintColumnsDto;

    @IsOptional()
    @IsString()
    agency?: string;

    @IsOptional()
    @IsString()
    employee?: string;
}

// Update Event DTO
export class UpdateEventDto {
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
    @Type(() => EventTravelerDto)
    travelers?: EventTravelerDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RoomGroupDto)
    room_groups?: RoomGroupDto[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    buses?: string[];

    @IsOptional()
    @IsString()
    hotel?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => PrintColumnsDto)
    print_columns?: PrintColumnsDto;
}

// Add Traveler DTO
export class AddTravelerDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => EventTravelerDto)
    travelers: EventTravelerDto[];
}

// Assign Bus DTO
export class AssignBusDto {
    @IsString()
    bus_id: string;

    @IsArray()
    @IsString({ each: true })
    traveler_ids: string[];
}

// Query DTO
export class EventQueryDto {
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
