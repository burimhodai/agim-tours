import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReportBusDocument = ReportBus & Document;

@Schema({ timestamps: true })
export class ReportBus {
  @Prop({ required: true })
  name: string;

  @Prop()
  plates?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const ReportBusSchema = SchemaFactory.createForClass(ReportBus);
