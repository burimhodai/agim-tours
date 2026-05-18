import mongoose from 'mongoose';

export const WebsiteHotelSchema = new mongoose.Schema(
  {
    name_sq: { type: String, required: true },
    name_mk: { type: String, required: true },
    city: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WebsiteCity',
      required: true,
    },
    location_sq: { type: String, required: true },
    location_mk: { type: String, required: true },
    location_maps_link: { type: String, required: true },
    images: { type: [String], default: [] },
    description_sq: { type: String },
    description_mk: { type: String },
    extra_info_sq: { type: String },
    extra_info_mk: { type: String },
    offer_start_date: { type: Date },
    offer_end_date: { type: Date },
    has_wifi: { type: Boolean, default: false },
    has_parking: { type: Boolean, default: false },
    has_breakfast: { type: Boolean, default: false },
    has_pool: { type: Boolean, default: false },
    has_ac: { type: Boolean, default: false },
    has_spa: { type: Boolean, default: false },
    has_gym: { type: Boolean, default: false },
    has_pet_friendly: { type: Boolean, default: false },
    has_restaurant: { type: Boolean, default: false },
    has_bar: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true },
    is_deleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

WebsiteHotelSchema.index({ is_deleted: 1 });
WebsiteHotelSchema.index({ city: 1 });
