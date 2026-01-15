import mongoose from 'mongoose';

export const PartnerHotelSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String },
    city: { type: String },
    country: { type: String },
    phone: { type: String },
    email: { type: String },
    contact_person: { type: String },
    notes: { type: String },
    is_active: { type: Boolean, default: true },
    agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', required: true },
}, {
    timestamps: true
});
