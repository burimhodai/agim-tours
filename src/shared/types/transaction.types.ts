import { Document, Types } from 'mongoose';
import { CurrencyTypes } from './currency.types';

export enum TransactionTypes {
    INCOME = 'income',
    OUTCOME = 'outcome',
}

export interface ITransaction extends Document {
    amount: number;
    currency?: CurrencyTypes;
    agency?: Types.ObjectId;
    user?: Types.ObjectId;
    ticket?: Types.ObjectId;
    type?: TransactionTypes;
    to: string;
    description: string;
    createdAt?: Date;
    updatedAt?: Date;
}
