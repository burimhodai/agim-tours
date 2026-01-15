import mongoose from 'mongoose';

export const RoomTypeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    capacity: { type: Number, required: true, min: 1 },
    agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', required: true },
}, {
    timestamps: true
});
