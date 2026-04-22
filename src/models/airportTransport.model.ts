import mongoose from 'mongoose';
import { CurrencyTypes } from 'src/shared/types/currency.types';

export const AirportTransportSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    date: { type: Date },
    hour: { type: String },
    vehicle_name: { type: String },
    price: { type: Number, default: 0 },
    currency: {
      type: String,
      enum: Object.values(CurrencyTypes),
      default: CurrencyTypes.EURO,
    },
    is_paid: { type: Boolean, default: false },
    number_of_people: { type: Number },
    contact_nr: { type: String },
    contact_person_name: { type: String },
    note: { type: String },
    agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency' },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  },
);
