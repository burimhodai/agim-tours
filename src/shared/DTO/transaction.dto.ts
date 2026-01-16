import { IsDate, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { CurrencyTypes } from '../types/currency.types';
import { TransactionTypes, TransactionStatus } from '../types/transaction.types';

export class CreateTransactionDto {
    @IsNumber()
    amount: number;

    @IsOptional()
    @IsEnum(CurrencyTypes)
    currency?: CurrencyTypes;

    @IsOptional()
    @IsString()
    agency?: string;

    @IsOptional()
    @IsString()
    user?: string;

    @IsOptional()
    @IsString()
    to?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    ticket?: string;

    @IsOptional()
    @IsEnum(TransactionTypes)
    type?: TransactionTypes;

    @IsOptional()
    @IsEnum(TransactionStatus)
    status?: TransactionStatus;
}

export class UpdateTransactionDto {
    @IsOptional()
    @IsNumber()
    amount?: number;

    @IsOptional()
    @IsEnum(TransactionTypes)
    type?: TransactionTypes;

    @IsOptional()
    @IsEnum(TransactionStatus)
    status?: TransactionStatus;

    @IsOptional()
    @IsString()
    description?: string;
}

export class TransactionQueryDto {
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    date?: Date;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    date_from?: Date;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    date_to?: Date;

    @IsOptional()
    @IsEnum(TransactionTypes)
    type?: TransactionTypes;

    @IsOptional()
    @IsEnum(TransactionStatus)
    status?: TransactionStatus;

    @IsOptional()
    @IsString()
    agency?: string;

    @IsOptional()
    @IsString()
    user?: string;

    @IsOptional()
    @IsString()
    to?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    ticket?: string;

}

