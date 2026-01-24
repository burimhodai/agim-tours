import mongoose from 'mongoose';
import { CurrencyTypes } from 'src/shared/types/currency.types';
import { PaymentStatusTypes } from 'src/shared/types/payment.types';

export const EventSchema = new mongoose.Schema(
  {
    name: { type: String },
    date: { type: Date },
    price: { type: Number },
    currency: {
      type: String,
      enum: Object.values(CurrencyTypes),
      default: CurrencyTypes.EURO,
    },

    //mos e prek teposht
    bookings: [
      {
        passengers: [
          {
            title: {
              type: String,
              enum: ['M', 'F', 'Infant', 'CHD'],
            },
            first_name: { type: String },
            last_name: { type: String },
            phone: { type: String },
            passport_number: { type: String, required: true },
            bus: { type: String },
            payment_status: {
              type: String,
              enum: Object.values(PaymentStatusTypes),
              default: PaymentStatusTypes.UNPAID,
            },
            employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            logs: [
              {
                title: String,
                description: String,
                created_at: { type: Date, default: Date.now },
              },
            ],
          },
        ],
      },
    ],
    //stop mos prek termo

    agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency' },
  },
  {
    timestamps: true,
  },
);
