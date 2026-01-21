import mongoose from 'mongoose';
import { CurrencyTypes } from 'src/shared/types/currency.types';
import {
  TransactionTypes,
  TransactionStatus,
} from 'src/shared/types/transaction.types';

export const TransactionSchema = new mongoose.Schema(
  {
    amount: { type: Number },
    currency: {
      type: String,
      enum: Object.values(CurrencyTypes),
      default: CurrencyTypes.EURO,
    },
    agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
    // Event hotel and organized travel references
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'EventHotel' },
    organizedTravel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OrganizedTravel',
    },
    travelerId: { type: String }, // Traveler subdocument _id as string
    type: {
      type: String,
      enum: Object.values(TransactionTypes),
      default: TransactionTypes.INCOME,
    },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.SETTLED,
    },
    to: { type: String },
    description: { type: String },
  },
  {
    timestamps: true,
  },
);
