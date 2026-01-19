import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrganizedTravelSchema } from 'src/models/organizedTravel.model';
import { EventBusSchema } from 'src/models/eventHotel.model';
import { TransactionSchema } from 'src/models/transaction.model';
import { OrganizedTravelService } from './services/organizedTravel.service';
import { OrganizedTravelController } from './controllers/organizedTravel.controller';
import { TransactionServiceService } from 'src/transactions/transaction-service.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'OrganizedTravel', schema: OrganizedTravelSchema },
            { name: 'EventBus', schema: EventBusSchema },
            { name: 'Transaction', schema: TransactionSchema },
        ]),
    ],
    controllers: [OrganizedTravelController],
    providers: [OrganizedTravelService, TransactionServiceService],
    exports: [OrganizedTravelService],
})
export class OrganizedTravelModule { }
