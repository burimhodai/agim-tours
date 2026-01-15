import {
    IsArray,
    IsBoolean,
    IsDate,
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CurrencyTypes } from '../types/currency.types';
import { PaymentStatusTypes } from '../types/payment.types';
import { PaymentChunkDto } from './payment-chunk.dto';

export class LuggageDto {
    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @IsNumber()
    weight_in_kg?: number;

    @IsOptional()
    @IsNumber()
    price?: number;
}

export class PassengerDto {
    @IsOptional()
    @IsString()
    first_name?: string;

    @IsOptional()
    @IsString()
    last_name?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsString()
    passport_number: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => LuggageDto)
    luggage?: LuggageDto[];
}

export class CreateBusTicketDto {
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

    @Type(() => Date)
    @IsDate()
    departure_date: Date;

    @Type(() => Date)
    @IsDate()
    arrival_date: Date;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    return_date?: Date;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    return_arrival_date?: Date;

    @IsString()
    departure_location: string;

    @IsString()
    destination_location: string;

    @IsOptional()
    @IsString()
    operator?: string;

    @IsOptional()
    @IsString()
    agency?: string;

    @IsOptional()
    @IsString()
    employee?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PassengerDto)
    passengers: PassengerDto[];

    @IsOptional()
    @IsString()
    note?: string;

    @IsOptional()
    @IsString()
    route_number?: string;

    @IsOptional()
    @IsString()
    booking_reference?: string;

    @IsOptional()
    @IsString()
    original_booking_reference?: string;
}

export class UpdateBusTicketDto {
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
    @Type(() => Date)
    @IsDate()
    departure_date?: Date;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    arrival_date?: Date;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    return_date?: Date;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    return_arrival_date?: Date;

    @IsOptional()
    @IsString()
    departure_location?: string;

    @IsOptional()
    @IsString()
    destination_location?: string;

    @IsOptional()
    @IsString()
    operator?: string;

    @IsOptional()
    @IsString()
    agency?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PassengerDto)
    passengers?: PassengerDto[];

    @IsOptional()
    @IsBoolean()
    checked_in?: boolean;

    @IsOptional()
    @IsString()
    note?: string;

    @IsOptional()
    @IsString()
    route_number?: string;

    @IsOptional()
    @IsString()
    booking_reference?: string;
}

export class AddLogDto {
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

export class BusTicketQueryDto {
    @IsOptional()
    @IsString()
    departure_location?: string;

    @IsOptional()
    @IsString()
    destination_location?: string;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    departure_date_from?: Date;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    departure_date_to?: Date;

    @IsOptional()
    @IsEnum(PaymentStatusTypes)
    payment_status?: PaymentStatusTypes;

    @IsOptional()
    @IsBoolean()
    checked_in?: boolean;

    @IsOptional()
    @IsString()
    operator?: string;

    @IsOptional()
    @IsString()
    route_number?: string;

    @IsOptional()
    @IsString()
    agency?: string;

    @IsOptional()
    @IsNumber()
    page?: number;

    @IsOptional()
    @IsNumber()
    limit?: number;
}
