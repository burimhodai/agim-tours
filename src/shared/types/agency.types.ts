import { Document } from 'mongoose';

export interface IAgency extends Document {
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}
