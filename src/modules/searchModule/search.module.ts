import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GlobalSearchController } from './global-search.controller';
import { GlobalSearchService } from './global-search.service';
import { TicketSchema } from 'src/models/ticket.model';
import { UserSchema } from 'src/models/user.model';
import { EventHotelSchema, EventBusSchema } from 'src/models/eventHotel.model';
import { HotelReservationSchema } from 'src/models/hotelReservation.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Ticket', schema: TicketSchema },
      { name: 'User', schema: UserSchema },
      { name: 'EventHotel', schema: EventHotelSchema },
      { name: 'EventBus', schema: EventBusSchema },
      { name: 'HotelReservation', schema: HotelReservationSchema },
    ]),
  ],
  controllers: [GlobalSearchController],
  providers: [GlobalSearchService],
  exports: [GlobalSearchService],
})
export class SearchModule {}
