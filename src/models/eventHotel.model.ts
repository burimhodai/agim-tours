import mongoose from 'mongoose';
import { CurrencyTypes } from 'src/shared/types/currency.types';

// duhet te centriret

export const EventHotelSchema = new mongoose.Schema({
    name: { type: String },
    date: { type: Date },
    price: { type: Number },
    currency: { type: String, enum: Object.values(CurrencyTypes), default: CurrencyTypes.EURO },
    
    passengers: [{
        first_name: { type: String },
        last_name: { type: String },
        phone: { type: String },
        passport_number: { type: String, required: true },
    }],

    has_hotel: { type: Boolean, default: false },
    has_transportation: { type: Boolean, default: true },
    
    departure_date: { type: Date, required: true },
    arrival_date: { type: Date, required: true },

    return_date: { type: Date },
    return_arrival_date: { type: Date },

    departure_location: { type: String, required: true },
    destination_location: { type: String, required: true },
    

    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    logs:[{
        title: String,
        description: String,
        employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
        created_at: { type: Date, default: Date.now }
    }],
    agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency' },



}, {
    timestamps: true
});