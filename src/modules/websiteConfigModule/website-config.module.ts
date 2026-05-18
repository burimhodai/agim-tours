import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WebsiteConfigController } from './website-config.controller';
import { WebsiteConfigService } from './website-config.service';
import { WebsiteCountrySchema } from '../../models/websiteCountry.model';
import { WebsiteCitySchema } from '../../models/websiteCity.model';
import { WebsiteHotelSchema } from '../../models/websiteHotel.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'WebsiteCountry', schema: WebsiteCountrySchema },
      { name: 'WebsiteCity', schema: WebsiteCitySchema },
      { name: 'WebsiteHotel', schema: WebsiteHotelSchema },
    ]),
  ],
  controllers: [WebsiteConfigController],
  providers: [WebsiteConfigService],
  exports: [WebsiteConfigService],
})
export class WebsiteConfigModule {}
