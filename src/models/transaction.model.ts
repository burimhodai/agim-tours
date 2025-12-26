import mongoose from 'mongoose';
import { CurrencyTypes } from 'src/shared/types/currency.types';
import { TransactionTypes } from 'src/shared/types/transaction.types';

export const TransactionSchema = new mongoose.Schema(
    {
        amount: { type: Number },
        currency: { type: String, enum: Object.values(CurrencyTypes), default: CurrencyTypes.EURO },
        agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency' },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
        type: { type: String, enum: Object.values(TransactionTypes), default: TransactionTypes.INCOME },
        to: { type: String },
        description: { type: String }
    },
    {
        timestamps: true,
    },
);

