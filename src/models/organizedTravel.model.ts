import mongoose from 'mongoose';
import { CurrencyTypes } from 'src/shared/types/currency.types';
import { PaymentStatusTypes } from 'src/shared/types/payment.types';

// Traveler/Passenger schema for organized travel (without hotel)
const OrganizedTravelerSchema = new mongoose.Schema({
    first_name: { type: String },
    last_name: { type: String },
    phone: { type: String },
    passport_number: { type: String },

    // Which lists to show this traveler in (no hotel list for organized travel)
    show_in_border_list: { type: Boolean, default: true },
    show_in_guide_list: { type: Boolean, default: true },

    // Bus assignment
    bus: { type: mongoose.Schema.Types.ObjectId, ref: 'EventBus' },

    note: { type: String },
});

// Main Organized Travel Schema
export const OrganizedTravelSchema = new mongoose.Schema({
    uid: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    location: { type: String, required: true },
    date: { type: Date, required: true }, // Data e nisjes
    return_date: { type: Date }, // Data e kthimit (opsionale)

    price: { type: Number },
    currency: { type: String, enum: Object.values(CurrencyTypes), default: CurrencyTypes.EURO },

    payment_status: {
        type: String,
        enum: Object.values(PaymentStatusTypes),
        default: PaymentStatusTypes.UNPAID,
    },

    travelers: [OrganizedTravelerSchema],

    // Assigned buses for this trip
    buses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EventBus' }],

    // Print column settings
    print_columns: {
        border_list: { type: [String], default: ['first_name', 'last_name', 'passport_number'] },
        guide_list: { type: [String], default: ['first_name', 'last_name', 'phone'] },
        bus_list: { type: [String], default: ['first_name', 'last_name', 'passport_number', 'phone'] },
    },

    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    logs: [{
        title: String,
        description: String,
        employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        created_at: { type: Date, default: Date.now }
    }],
    agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency' },

    is_deleted: { type: Boolean, default: false },
}, {
    timestamps: true
});
