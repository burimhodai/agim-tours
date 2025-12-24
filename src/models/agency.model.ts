import mongoose from 'mongoose';

export const AgencySchema = new mongoose.Schema({
    name: { type: String },
}, {
    timestamps: true
});