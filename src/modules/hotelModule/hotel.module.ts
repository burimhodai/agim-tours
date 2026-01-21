import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Schemas
import { RoomTypeSchema } from 'src/models/roomType.model';
import { PartnerHotelSchema } from 'src/models/partnerHotel.model';
import { HotelReservationSchema } from 'src/models/hotelReservation.model';

// Services
import { RoomTypeService } from './services/room-type.service';
import { PartnerHotelService } from './services/partner-hotel.service';
import { HotelReservationService } from './services/hotel-reservation.service';

// Controllers
import { RoomTypeController } from './controllers/room-type.controller';
import { PartnerHotelController } from './controllers/partner-hotel.controller';
import { HotelReservationController } from './controllers/hotel-reservation.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'RoomType', schema: RoomTypeSchema },
      { name: 'PartnerHotel', schema: PartnerHotelSchema },
      { name: 'HotelReservation', schema: HotelReservationSchema },
    ]),
  ],
  controllers: [
    RoomTypeController,
    PartnerHotelController,
    HotelReservationController,
  ],
  providers: [RoomTypeService, PartnerHotelService, HotelReservationService],
  exports: [RoomTypeService, PartnerHotelService, HotelReservationService],
})
export class HotelModule {}
