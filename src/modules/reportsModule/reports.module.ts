import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportsController } from './controllers/reports.controller';
import { ReportsService } from './services/reports.service';
import { SeedDataService } from './services/seed-data.service';
import { TransactionSchema } from 'src/models/transaction.model';
import { TicketSchema } from 'src/models/ticket.model';
import { HotelReservationSchema } from 'src/models/hotelReservation.model';
import { TransactionServiceService } from 'src/transactions/transaction-service.service';
import { AgencySchema } from 'src/models/agency.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Transaction', schema: TransactionSchema },
      { name: 'Ticket', schema: TicketSchema },
      { name: 'HotelReservation', schema: HotelReservationSchema },
      { name: 'Agency', schema: AgencySchema },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService, SeedDataService, TransactionServiceService],
  exports: [ReportsService],
})
export class ReportsModule {}
