import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AirportTransportService } from './services/airportTransport.service';
import { AirportTransportController } from './controllers/airportTransport.controller';
import { AirportTransportSchema } from 'src/models/airportTransport.model';
import { TransactionSchema } from 'src/models/transaction.model';
import { AgencySchema } from 'src/models/agency.model';
import { UserSchema } from 'src/models/user.model';
import { TransactionServiceService } from 'src/transactions/transaction-service.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'AirportTransport', schema: AirportTransportSchema },
      { name: 'Transaction', schema: TransactionSchema },
      { name: 'Agency', schema: AgencySchema },
      { name: 'User', schema: UserSchema },
    ]),
  ],
  controllers: [AirportTransportController],
  providers: [AirportTransportService, TransactionServiceService],
  exports: [AirportTransportService],
})
export class AirportTransportModule {}
