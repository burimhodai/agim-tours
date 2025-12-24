import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { BusModule } from './modules/busModule/bus.module';
import { EventModule } from './modules/eventModule/event.module';
import { EventHotelModule } from './modules/eventHotelModule/eventHotel.module';
import { PlaneModule } from './modules/planeModule/plane.module';
import { UserModule } from './modules/userModule/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AgencySchema } from './models/agency.model';
import { TransactionSchema } from './models/transaction.model';
import { TransactionControllerController } from './transactions/transaction-controller.controller';
import { TransactionServiceService } from './transactions/transaction-service.service';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbUrl = configService.get<string>('DATABASE_URL');

        return { uri: dbUrl };
      },
    }),

    MongooseModule.forFeature([
      { name: 'Agency', schema: AgencySchema },
      { name: 'Transaction', schema: TransactionSchema },
    ]),

    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    BusModule,
    EventModule,
    EventHotelModule,
    PlaneModule,
    UserModule,
  ],
  controllers: [AppController, TransactionControllerController],
  providers: [AppService, TransactionServiceService],
})
export class AppModule { }
