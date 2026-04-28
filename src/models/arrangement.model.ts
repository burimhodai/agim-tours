import mongoose from 'mongoose';
import { CurrencyTypes } from 'src/shared/types/currency.types';
import { PaymentStatusTypes } from 'src/shared/types/payment.types';
import { RoomTypes } from 'src/shared/types/hotel.types';

export const ArrangementSchema = new mongoose.Schema(
  {
    uid: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    destination: { type: String, required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },

    hotel_partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PartnerHotel',
    },
    hotel_name: { type: String, required: true },
    check_in_date: { type: Date, required: true },
    check_out_date: { type: Date, required: true },

    room_groups: [
      {
        group_id: { type: String, required: true },
        room_type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomType' },
        room_type_name: { type: String },
        room_number: { type: String },
      },
    ],

    departure_location: { type: String, required: true },
    destination_location: { type: String, required: true },
    departure_date: { type: Date, required: true },
    return_date: { type: Date },
    route_number: { type: String },
    return_route_number: { type: String },
    
    operatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Operator' },
    operator: { type: String },
    
    plane_ticket_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },

    price: { type: Number, required: true },
    currency: {
      type: String,
      enum: Object.values(CurrencyTypes),
      default: CurrencyTypes.EURO,
    },
    payment_status: {
      type: String,
      enum: Object.values(PaymentStatusTypes),
      default: PaymentStatusTypes.UNPAID,
    },
    payment_chunks: [
      {
        amount: { type: Number, required: true },
        currency: {
          type: String,
          enum: Object.values(CurrencyTypes),
          required: true,
        },
        payment_date: { type: Date, default: Date.now },
      },
    ],

    travelers: [
      {
        title: { type: String },
        first_name: { type: String, required: true },
        last_name: { type: String, required: true },
        phone: { type: String },
        passport_number: { type: String },
        birthdate: { type: Date },
        passport_expiry_date: { type: Date },
        passport_issue_date: { type: Date },
        nationality: { type: String },
        luggage: [
          {
            type: { type: String },
            category: {
              type: String,
              enum: ['CHECKIN_LUGGAGE', 'HAND_BAG'],
            },
            weight_in_kg: Number,
            price: Number,
            quantity: { type: Number, default: 1 },
          },
        ],
        return_luggage: [
          {
            type: { type: String },
            category: {
              type: String,
              enum: ['CHECKIN_LUGGAGE', 'HAND_BAG'],
            },
            weight_in_kg: Number,
            price: Number,
            quantity: { type: Number, default: 1 },
          },
        ],
        room_group_id: { type: String },
        room_type: {
          type: String,
          enum: Object.values(RoomTypes),
        },
      },
    ],

    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency' },

    logs: [
      {
        title: String,
        description: String,
        employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        created_at: { type: Date, default: Date.now },
      },
    ],
    
    is_deleted: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'canceled'], default: 'active' },
  },
  {
    timestamps: true,
  },
);
