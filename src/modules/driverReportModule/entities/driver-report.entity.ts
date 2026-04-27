import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DriverReportDocument = DriverReport & Document;

@Schema({ timestamps: true })
export class DriverReport {
  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  promet: number;

  @Prop({ required: true })
  tur: number;

  @Prop({ required: false })
  bus: string;

  @Prop({ required: true })
  driver: string;

  @Prop({ required: true })
  employee: string;

  @Prop({ default: false })
  isExtraTur: boolean;

  @Prop()
  extraTurName: string;
  @Prop()
  userId: string;
}

export const DriverReportSchema = SchemaFactory.createForClass(DriverReport);
