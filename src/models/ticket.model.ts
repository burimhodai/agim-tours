import mongoose from 'mongoose';
import { CurrencyTypes } from 'src/shared/types/currency.types';
import { PaymentStatusTypes } from 'src/shared/types/payment.types';
import { TicketTypes } from 'src/shared/types/ticket.types';

export const TicketSchema = new mongoose.Schema(
  {
    uid: { type: String, unique: true, sparse: true },
    ticket_type: { type: String, enum: Object.values(TicketTypes) },
    booking_reference: { type: String, lowercase: true },
    original_booking_reference: { type: String, lowercase: true },

    price: { type: Number, required: true },
    neto_price: { type: Number },
    currency: {
      type: String,
      enum: Object.values(CurrencyTypes),
      default: CurrencyTypes.MKD,
    },
    provision: { type: Number, default: 0 },
    provision_currency: {
      type: String,
      enum: Object.values(CurrencyTypes),
      default: CurrencyTypes.MKD,
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

    departure_date: { type: Date, required: true },
    arrival_date: { type: Date },

    return_date: { type: Date },
    return_arrival_date: { type: Date },

    departure_location: { type: String, required: true },
    destination_location: { type: String, required: true },

    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    logs: [
      {
        title: String,
        description: String,
        employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        created_at: { type: Date, default: Date.now },
      },
    ],

    agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency' },
    operator: { type: String },

    passengers: [
      {
        title: {
          type: String,
          enum: ['Mr', 'Mrs', 'Miss', 'Ms', 'Infant', 'CHD'],
        },
        first_name: { type: String },
        last_name: { type: String },
        phone: { type: String },
        passport_number: { type: String },
        birthdate: { type: Date },
        passport_expiry_date: { type: Date },
        nationality: { type: String },
        luggage: [
          {
            type: { type: String }, // Name of the luggage type
            weight_in_kg: Number,
            price: Number,
            quantity: { type: Number, default: 1 },
          },
        ],
        return_luggage: [
          {
            type: { type: String },
            weight_in_kg: Number,
            price: Number,
            quantity: { type: Number, default: 1 },
          },
        ],
      },
    ],

    checked_in: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'canceled'], default: 'active' },
    note: { type: String },
    route_number: { type: String },
  },
  {
    timestamps: true,
  },
);
