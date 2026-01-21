import mongoose from 'mongoose';
import { PartnerTypes } from 'src/shared/types/partner.types';

export const PartnerSchema = new mongoose.Schema(
  {
    name: { type: String },
    type: { type: String, enum: Object.values(PartnerTypes) },
  },
  {
    timestamps: true,
  },
);
