import mongoose from 'mongoose';

export const LuggageTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g., "20kg", "10kg", "Handbag"
    category: {
      type: String,
      enum: ['CHECKIN_LUGGAGE', 'HAND_BAG'],
      default: 'CHECKIN_LUGGAGE',
    },
    agency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agency',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);
