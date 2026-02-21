import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrganizedTravelSchema } from 'src/models/organizedTravel.model';
import { EventBusSchema } from 'src/models/eventHotel.model';
import { TransactionSchema } from 'src/models/transaction.model';
import { AgencySchema } from 'src/models/agency.model';
import { UserSchema } from 'src/models/user.model';
import { OrganizedTravelService } from './services/organizedTravel.service';
import { OrganizedTravelController } from './controllers/organizedTravel.controller';
import { TransactionServiceService } from 'src/transactions/transaction-service.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'OrganizedTravel', schema: OrganizedTravelSchema },
      { name: 'EventBus', schema: EventBusSchema },
      { name: 'Transaction', schema: TransactionSchema },
      { name: 'Agency', schema: AgencySchema },
      { name: 'User', schema: UserSchema },
    ]),
  ],
  controllers: [OrganizedTravelController],
  providers: [OrganizedTravelService, TransactionServiceService],
  exports: [OrganizedTravelService],
})
export class OrganizedTravelModule { }
