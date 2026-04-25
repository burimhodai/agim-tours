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
  nafta: number;

  @Prop({ required: true })
  tur: number;

  @Prop({ required: true })
  perqindja: number;

  @Prop({ required: true })
  litra: number;

  @Prop({ required: true })
  bus: string;

  @Prop({ required: true })
  driver: string;

  @Prop({ required: true })
  employee: string;
}

export const DriverReportSchema = SchemaFactory.createForClass(DriverReport);
