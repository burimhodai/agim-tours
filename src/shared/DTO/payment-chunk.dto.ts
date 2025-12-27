import { IsEnum, IsNumber, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { CurrencyTypes } from '../types/currency.types';

export class PaymentChunkDto {
    @IsNumber()
    amount: number;

    @IsEnum(CurrencyTypes)
    currency: CurrencyTypes;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    payment_date?: Date;
}
