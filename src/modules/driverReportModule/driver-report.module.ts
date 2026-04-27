import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DriverReportService } from './driver-report.service';
import { DriverReportController } from './driver-report.controller';
import { DriverReport, DriverReportSchema } from './entities/driver-report.entity';
import { TransactionSchema } from 'src/models/transaction.model';
import { AgencySchema } from 'src/models/agency.model';
import { UserSchema } from 'src/models/user.model';
import { TransactionServiceService } from 'src/transactions/transaction-service.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DriverReport.name, schema: DriverReportSchema },
      { name: 'Transaction', schema: TransactionSchema },
      { name: 'Agency', schema: AgencySchema },
      { name: 'User', schema: UserSchema },
    ]),
  ],
  controllers: [DriverReportController],
  providers: [DriverReportService, TransactionServiceService],
  exports: [DriverReportService],
})
export class DriverReportModule {}
