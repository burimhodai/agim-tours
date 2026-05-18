import mongoose from 'mongoose';

export const WebsiteCountrySchema = new mongoose.Schema(
  {
    name_sq: { type: String, required: true },
    name_mk: { type: String, required: true },
    is_active: { type: Boolean, default: true },
    is_deleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

WebsiteCountrySchema.index({ is_deleted: 1 });
