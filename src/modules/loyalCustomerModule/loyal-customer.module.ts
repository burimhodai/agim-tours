import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoyalCustomerController } from './loyal-customer.controller';
import { LoyalCustomerService } from './loyal-customer.service';
import { LoyalCustomerSchema } from '../../models/loyalCustomer.model';
import { AgencySchema } from '../../models/agency.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'LoyalCustomer', schema: LoyalCustomerSchema },
      { name: 'Agency', schema: AgencySchema },
    ]),
  ],
  controllers: [LoyalCustomerController],
  providers: [LoyalCustomerService],
})
export class LoyalCustomerModule {}
