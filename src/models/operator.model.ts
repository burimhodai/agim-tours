import mongoose from 'mongoose';

export const OperatorSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        logo: { type: String, required: false },
        type: { type: String, enum: ['hotel', 'plane'], default: 'hotel' },
        agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', required: true },
        isDeleted: { type: Boolean, default: false },
    },
    {
        timestamps: true,
    },
);
