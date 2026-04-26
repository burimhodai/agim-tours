import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DriverDocument = Driver & Document;

@Schema({ timestamps: true })
export class Driver {
  @Prop({ required: true })
  name: string;

  @Prop()
  phone?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const DriverSchema = SchemaFactory.createForClass(Driver);
