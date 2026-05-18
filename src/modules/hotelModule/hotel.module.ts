import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Schemas
import { RoomTypeSchema } from 'src/models/roomType.model';
import { PartnerHotelSchema } from 'src/models/partnerHotel.model';
import { HotelReservationSchema } from 'src/models/hotelReservation.model';
import { OperatorSchema } from 'src/models/operator.model';
import { TransactionSchema } from 'src/models/transaction.model';
import { AgencySchema } from 'src/models/agency.model';
import { TransactionServiceService } from 'src/transactions/transaction-service.service';

// Services
import { RoomTypeService } from './services/room-type.service';
import { PartnerHotelService } from './services/partner-hotel.service';
import { HotelReservationService } from './services/hotel-reservation.service';
import { OperatorService } from './services/operator.service';

// Controllers
import { RoomTypeController } from './controllers/room-type.controller';
import { PartnerHotelController } from './controllers/partner-hotel.controller';
import { HotelReservationController } from './controllers/hotel-reservation.controller';
import { OperatorController } from './controllers/operator.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'RoomType', schema: RoomTypeSchema },
      { name: 'PartnerHotel', schema: PartnerHotelSchema },
      { name: 'HotelReservation', schema: HotelReservationSchema },
      { name: 'Operator', schema: OperatorSchema },
      { name: 'Transaction', schema: TransactionSchema },
      { name: 'Agency', schema: AgencySchema },
    ]),
  ],
  controllers: [
    RoomTypeController,
    PartnerHotelController,
    HotelReservationController,
    OperatorController,
  ],
  providers: [
    RoomTypeService,
    PartnerHotelService,
    HotelReservationService,
    OperatorService,
    TransactionServiceService,
  ],
  exports: [
    RoomTypeService,
    PartnerHotelService,
    HotelReservationService,
    OperatorService,
  ],
})
export class HotelModule {}
