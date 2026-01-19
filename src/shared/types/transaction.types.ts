import { Document, Types } from 'mongoose';
import { CurrencyTypes } from './currency.types';

export enum TransactionTypes {
    INCOME = 'income',
    OUTCOME = 'outcome',
    DEBT = 'debt', // Borxh - unpaid ticket
}

export enum TransactionStatus {
    PENDING = 'pending', // Debt not yet paid
    SETTLED = 'settled', // Debt paid or income received
}

export interface ITransaction extends Document {
    amount: number;
    currency?: CurrencyTypes;
    agency?: Types.ObjectId;
    user?: Types.ObjectId;
    ticket?: Types.ObjectId;
    event?: Types.ObjectId;
    organizedTravel?: Types.ObjectId;
    travelerId?: string;
    type?: TransactionTypes;
    status?: TransactionStatus;
    to: string;
    description: string;
    createdAt?: Date;
    updatedAt?: Date;
}

