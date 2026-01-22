import { Document, Types } from 'mongoose';

// Room Type Enums (for quick selection)
export enum RoomTypes {
  SINGLE = 'single',
  DOUBLE = 'double',
  TRIPLE = 'triple',
  QUAD = 'quad',
  SUITE = 'suite',
}

// Reservation Status
export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

// Room Type Interface
export interface IRoomType extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  capacity: number;
  agency: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Partner Hotel Interface
export interface IPartnerHotel extends Document {
  _id: Types.ObjectId;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  contact_person?: string;
  notes?: string;
  is_active: boolean;
  agency: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Traveler Interface
export interface ITraveler {
  full_name: string;
  passport_number: string;
  passport_expiry_date?: Date;
  date_of_birth: Date;
  place_of_birth: string;
  room_type: string;
  departure_place: string;
  show_in_hotel_list: boolean;
  show_in_border_list: boolean;
  show_in_guide_list: boolean;
  bus_assignment?: string;
}

// Log Entry Interface
export interface ILogEntry {
  title?: string;
  description?: string;
  employee?: Types.ObjectId;
  created_at: Date;
}

// Hotel Reservation Interface
export interface IHotelReservation extends Document {
  _id: Types.ObjectId;
  hotel_booking_id: string;
  hotel_partner: Types.ObjectId;
  hotel_name: string;
  check_in_date: Date;
  check_out_date: Date;
  departure_city?: string;
  arrival_city?: string;
  status: ReservationStatus;
  notes?: string;
  travelers: ITraveler[];
  employee?: Types.ObjectId;
  agency?: Types.ObjectId;
  logs: ILogEntry[];
  is_deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
