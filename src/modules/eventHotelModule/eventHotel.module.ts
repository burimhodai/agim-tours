import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventHotelSchema, EventBusSchema } from 'src/models/eventHotel.model';
import { EventHotelService } from './services/eventHotel.service';
import { EventBusService } from './services/eventBus.service';
import { EventHotelController } from './controllers/eventHotel.controller';
import { EventBusController } from './controllers/eventBus.controller';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'EventHotel', schema: EventHotelSchema },
            { name: 'EventBus', schema: EventBusSchema },
        ]),
    ],
    controllers: [EventHotelController, EventBusController],
    providers: [EventHotelService, EventBusService],
    exports: [EventHotelService, EventBusService],
})
export class EventHotelModule { }