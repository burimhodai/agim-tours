import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrganizedTravelSchema } from 'src/models/organizedTravel.model';
import { EventBusSchema } from 'src/models/eventHotel.model';
import { OrganizedTravelService } from './services/organizedTravel.service';
import { OrganizedTravelController } from './controllers/organizedTravel.controller';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'OrganizedTravel', schema: OrganizedTravelSchema },
            { name: 'EventBus', schema: EventBusSchema },
        ]),
    ],
    controllers: [OrganizedTravelController],
    providers: [OrganizedTravelService],
    exports: [OrganizedTravelService],
})
export class OrganizedTravelModule { }
