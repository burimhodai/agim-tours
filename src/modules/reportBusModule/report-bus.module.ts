import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportBusService } from './report-bus.service';
import { ReportBusController } from './report-bus.controller';
import { ReportBus, ReportBusSchema } from './entities/report-bus.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ReportBus.name, schema: ReportBusSchema }]),
  ],
  controllers: [ReportBusController],
  providers: [ReportBusService],
  exports: [ReportBusService],
})
export class ReportBusModule {}
