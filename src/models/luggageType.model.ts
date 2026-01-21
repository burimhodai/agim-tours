import mongoose from 'mongoose';

export const LuggageTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g., "20kg", "10kg", "Handbag"
    category: {
      type: String,
      enum: ['luggage', 'handbag'],
      default: 'luggage',
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
