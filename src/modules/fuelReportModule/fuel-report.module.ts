import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FuelReportService } from './fuel-report.service';
import { FuelReportController } from './fuel-report.controller';
import { FuelReport, FuelReportSchema } from './entities/fuel-report.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: FuelReport.name, schema: FuelReportSchema }]),
  ],
  controllers: [FuelReportController],
  providers: [FuelReportService],
  exports: [FuelReportService],
})
export class FuelReportModule {}
