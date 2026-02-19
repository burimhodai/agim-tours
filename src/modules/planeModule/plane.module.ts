import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlaneController } from './controllers/plane.controller';
import { PlaneService } from './services/plane.service';
import { TicketSchema } from 'src/models/ticket.model';
import { TransactionSchema } from 'src/models/transaction.model';
import { UserSchema } from 'src/models/user.model';
import { AgencySchema } from 'src/models/agency.model';
import { TransactionServiceService } from 'src/transactions/transaction-service.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Ticket', schema: TicketSchema },
      { name: 'Transaction', schema: TransactionSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Agency', schema: AgencySchema },
    ]),
  ],
  controllers: [PlaneController],
  providers: [PlaneService, TransactionServiceService],
  exports: [PlaneService],
})
export class PlaneModule { }
