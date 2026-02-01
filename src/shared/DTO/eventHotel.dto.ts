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
    _id?: string;

    @IsOptional()
    @IsString()
    title?: string;

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
    @Type(() => Date)
    @IsDate()
    passport_expiry_date?: Date;

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
    employee?: string;
}

export class RoomGroupDto {
    @IsOptional()
    @IsString()
    _id?: string;

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
    @Type(() => Date)
    @IsDate()
    check_in_date?: Date;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    check_out_date?: Date;

    @IsOptional()
    @IsString()
    departure_city?: string;

    @IsOptional()
    @IsString()
    arrival_city?: string;

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
    @ValidateNested({ each: true })
    @Type(() => EventStartDto)
    starts?: EventStartDto[];

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

    @IsOptional()
    @IsString()
    documentId?: string;
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
    @Type(() => Date)
    @IsDate()
    check_in_date?: Date;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    check_out_date?: Date;

    @IsOptional()
    @IsString()
    departure_city?: string;

    @IsOptional()
    @IsString()
    arrival_city?: string;

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
    @ValidateNested({ each: true })
    @Type(() => EventStartDto)
    starts?: EventStartDto[];

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

    @IsOptional()
    @IsString()
    documentId?: string;
}

// Add Traveler DTO
export class AddTravelerDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => EventTravelerDto)
    travelers: EventTravelerDto[];

    @IsOptional()
    @IsString()
    agency?: string;

    @IsOptional()
    @IsString()
    employee?: string;
}

// Assign Bus DTO
export class AssignBusDto {
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
export class RefundTravelerDto {
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
