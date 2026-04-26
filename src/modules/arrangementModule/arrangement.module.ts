import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ArrangementController } from './controllers/arrangement.controller';
import { ArrangementService } from './services/arrangement.service';
import { ArrangementSchema } from 'src/models/arrangement.model';
import { TicketSchema } from 'src/models/ticket.model';
import { PartnerHotelSchema } from 'src/models/partnerHotel.model';
import { OperatorSchema } from 'src/models/operator.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Arrangement', schema: ArrangementSchema },
      { name: 'Ticket', schema: TicketSchema },
      { name: 'PartnerHotel', schema: PartnerHotelSchema },
      { name: 'Operator', schema: OperatorSchema },
    ]),
  ],
  controllers: [ArrangementController],
  providers: [ArrangementService],
})
export class ArrangementModule {}
