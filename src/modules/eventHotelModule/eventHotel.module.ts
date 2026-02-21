import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventHotelSchema, EventBusSchema } from 'src/models/eventHotel.model';
import { TransactionSchema } from 'src/models/transaction.model';
import { AgencySchema } from 'src/models/agency.model';
import { UserSchema } from 'src/models/user.model';
import { EventHotelService } from './services/eventHotel.service';
import { EventBusService } from './services/eventBus.service';
import { EventHotelController } from './controllers/eventHotel.controller';
import { EventBusController } from './controllers/eventBus.controller';
import { TransactionServiceService } from 'src/transactions/transaction-service.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'EventHotel', schema: EventHotelSchema },
      { name: 'EventBus', schema: EventBusSchema },
      { name: 'Transaction', schema: TransactionSchema },
      { name: 'Agency', schema: AgencySchema },
      { name: 'User', schema: UserSchema },
    ]),
  ],
  controllers: [EventHotelController, EventBusController],
  providers: [EventHotelService, EventBusService, TransactionServiceService],
  exports: [EventHotelService, EventBusService],
})
export class EventHotelModule { }
