import { Document, Types } from 'mongoose';
import { CurrencyTypes } from 'src/shared/types/currency.types';
import { PaymentStatusTypes } from 'src/shared/types/payment.types';

export enum TicketTypes {
    BUS = 'bus',
    PLANE = 'plane',
}

export interface ILog {
    title?: string;
    description?: string;
    employee?: Types.ObjectId;
    created_at?: Date;
}

export interface ILuggage {
    type?: string;
    weight_in_kg?: number;
    price?: number;
}

export interface IPassenger {
    first_name?: string;
    last_name?: string;
    phone?: string;
    passport_number?: string;
    birthdate?: Date;
    passport_expiry_date?: Date;
    nationality?: string;
    luggage?: ILuggage[];
}

export interface IPaymentChunk {
    amount: number;
    currency: CurrencyTypes;
    payment_date?: Date;
}

export interface ITicket extends Document {
    uid?: string;
    ticket_type?: TicketTypes;
    booking_reference?: string;
    original_booking_reference?: string;

    price: number;
    currency?: CurrencyTypes;

    payment_status?: PaymentStatusTypes;
    payment_chunks?: IPaymentChunk[];

    departure_date: Date;
    arrival_date?: Date;

    return_date?: Date;
    return_arrival_date?: Date;

    departure_location: string;
    destination_location: string;

    employee?: Types.ObjectId;
    logs?: ILog[];

    agency?: Types.ObjectId;
    operator?: string;

    passengers?: IPassenger[];

    checked_in?: boolean;
    note?: string;
    route_number?: string;

    is_deleted?: boolean;

    createdAt?: Date;
    updatedAt?: Date;
}
