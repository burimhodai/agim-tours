import mongoose from 'mongoose';

// Purchase history schema - tracks each purchase made by the customer
const PurchaseHistorySchema = new mongoose.Schema({
    ticket_type: {
        type: String,
        enum: ['bus', 'plane', 'hotel', 'event'],
        required: true
    },
    ticket_id: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'purchase_history.ticket_ref_model'
    },
    ticket_ref_model: {
        type: String,
        enum: ['Ticket', 'HotelReservation', 'EventHotel']
    },
    booking_reference: { type: String },
    departure_location: { type: String },
    destination_location: { type: String },
    travel_date: { type: Date },
    amount: { type: Number },
    currency: { type: String },
    purchased_at: { type: Date, default: Date.now }
});

// Main Loyal Customer Schema
export const LoyalCustomerSchema = new mongoose.Schema({
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    passport_number: { type: String },
    passport_expiry_date: { type: Date },
    date_of_birth: { type: Date },
    nationality: { type: String },
    address: { type: String },
    city: { type: String },
    country: { type: String },

    // Statistics
    total_purchases: { type: Number, default: 0 },
    total_spent: { type: Number, default: 0 },

    // Purchase history
    purchase_history: [PurchaseHistorySchema],

    // Notes
    notes: { type: String },

    // Agency reference
    agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', required: true },

    // Soft delete
    is_deleted: { type: Boolean, default: false },
}, {
    timestamps: true
});

// Index for faster lookups
LoyalCustomerSchema.index({ agency: 1, is_deleted: 1 });
LoyalCustomerSchema.index({ first_name: 'text', last_name: 'text', phone: 'text', passport_number: 'text' });
