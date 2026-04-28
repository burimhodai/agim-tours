import { Document, Types } from 'mongoose';
import { CurrencyTypes } from './currency.types';
import { PaymentStatusTypes } from './payment.types';
import { RoomTypes } from './hotel.types';
import { ILuggage } from './ticket.types';

export interface IArrangementTraveler {
  title?: string;
  first_name: string;
  last_name: string;
  phone?: string;
  passport_number?: string;
  birthdate?: Date;
  passport_expiry_date?: Date;
  passport_issue_date?: Date;
  nationality?: string;
  luggage?: ILuggage[];
  return_luggage?: ILuggage[];
  room_group_id?: string;
  room_type?: RoomTypes;
}

export interface IRoomGroup {
  group_id: string;
  room_type_id?: Types.ObjectId | string;
  room_type_name?: string;
  room_number?: string;
}

export interface IArrangement extends Document {
  uid?: string;
  name: string;
  destination: string;
  start_date: Date;
  end_date: Date;
  
  hotel_partner?: Types.ObjectId | string;
  hotel_name: string;
  check_in_date: Date;
  check_out_date: Date;
  room_groups?: IRoomGroup[];
  
  departure_location: string;
  destination_location: string;
  departure_date: Date;
  return_date?: Date;
  route_number?: string;
  return_route_number?: string;
  operatorId?: Types.ObjectId | string;
  operator?: string;
  plane_ticket_id?: Types.ObjectId | string;

  price: number;
  currency: CurrencyTypes;
  payment_status: PaymentStatusTypes;
  payment_chunks?: { amount: number; currency: CurrencyTypes; payment_date?: Date }[];
  
  travelers: IArrangementTraveler[];
  
  agency?: Types.ObjectId | string;
  employee?: Types.ObjectId | string;
  logs?: { title?: string; description?: string; employee?: Types.ObjectId | string; created_at?: Date }[];
  is_deleted?: boolean;
  status?: 'active' | 'canceled';
  
  createdAt?: Date;
  updatedAt?: Date;
}
