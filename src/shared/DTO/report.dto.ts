import { IsDate, IsEnum, IsOptional, IsString, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { TicketTypes } from '../types/ticket.types';

export enum ReportPeriod {
    DAILY = 'daily',
    WEEKLY = 'weekly',
    MONTHLY = 'monthly',
    YEARLY = 'yearly',
    CUSTOM = 'custom',
}

export class ReportQueryDto {
    @IsEnum(ReportPeriod)
    period: ReportPeriod;

    @IsOptional()
    @IsEnum(TicketTypes)
    module?: TicketTypes;

    @IsOptional()
    @IsString()
    agency?: string;

    @IsOptional()
    @IsString()
    employee?: string;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    date_from?: Date;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    date_to?: Date;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    specific_date?: Date;
}

export class CurrencySummary {
    currency: string;
    total: number;
    count: number;
}

export class ReportTransactionItem {
    _id: string;
    amount: number;
    currency?: string;
    type?: string;
    to?: string;
    description?: string;
    createdAt?: Date;
    user?: {
        _id: string;
        email: string;
        first_name?: string;
        last_name?: string;
    };
    ticket?: {
        _id: string;
        ticket_type?: string;
        booking_reference?: string;
        departure_location?: string;
        destination_location?: string;
        departure_date?: Date;
        passengers?: any[];
        operator?: string;
        price: number;
    };
}

export class ReportResponseDto {
    period: ReportPeriod;
    module?: TicketTypes;
    dateRange: {
        from: Date;
        to: Date;
    };
    income: {
        transactions: ReportTransactionItem[];
        summary: CurrencySummary[];
    };
    outcome: {
        transactions: ReportTransactionItem[];
        summary: CurrencySummary[];
    };
}
