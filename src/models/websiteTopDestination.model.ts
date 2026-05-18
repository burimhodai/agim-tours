import mongoose from 'mongoose';

export const WebsiteTopDestinationSchema = new mongoose.Schema(
  {
    city: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WebsiteCity',
      required: true,
    },
    image: { type: String, required: true },
    is_active: { type: Boolean, default: true },
    is_deleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

WebsiteTopDestinationSchema.index({ is_deleted: 1 });
WebsiteTopDestinationSchema.index({ city: 1 });
