import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DriverReportService } from './driver-report.service';
import { DriverReportController } from './driver-report.controller';
import { DriverReport, DriverReportSchema } from './entities/driver-report.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DriverReport.name, schema: DriverReportSchema },
    ]),
  ],
  controllers: [DriverReportController],
  providers: [DriverReportService],
  exports: [DriverReportService],
})
export class DriverReportModule {}
