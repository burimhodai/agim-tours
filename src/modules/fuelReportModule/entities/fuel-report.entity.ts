import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FuelReportDocument = FuelReport & Document;

@Schema({ timestamps: true })
export class FuelReport {
  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  nafta: number;

  @Prop({ required: true })
  litra: number;

  @Prop({ required: true })
  bus: string;

  @Prop({ required: true })
  driver: string;

  @Prop({ required: true })
  employee: string;
}

export const FuelReportSchema = SchemaFactory.createForClass(FuelReport);
