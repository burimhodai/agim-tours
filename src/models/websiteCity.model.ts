import mongoose from 'mongoose';

export const WebsiteCitySchema = new mongoose.Schema(
  {
    name_sq: { type: String, required: true },
    name_mk: { type: String, required: true },
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WebsiteCountry',
      required: true,
    },
    is_active: { type: Boolean, default: true },
    is_deleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

WebsiteCitySchema.index({ is_deleted: 1 });
WebsiteCitySchema.index({ country: 1 });
