import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BusController } from './controllers/bus.controller';
import { BusService } from './services/bus.service';
import { TicketSchema } from 'src/models/ticket.model';
import { TransactionSchema } from 'src/models/transaction.model';
import { TransactionServiceService } from 'src/transactions/transaction-service.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Ticket', schema: TicketSchema },
      { name: 'Transaction', schema: TransactionSchema },
    ]),
  ],
  controllers: [BusController],
  providers: [BusService, TransactionServiceService],
  exports: [BusService],
})
export class BusModule {}
