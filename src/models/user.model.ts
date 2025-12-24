import mongoose from 'mongoose';
import { UserPermissions } from 'src/shared/types/permission.types';
import { UserRoles } from 'src/shared/types/user.types';

export const UserSchema = new mongoose.Schema(
  {
    first_name: { type: String },
    last_name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency' },
    role: {
      type: String,
      enum: Object.values(UserRoles),
      default: UserRoles.USER,
    },
    permissions: [
      {
        type: String,
        enum: Object.values(UserPermissions),
      },
    ],
  },
  {
    timestamps: true,
  },
);
