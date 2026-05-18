import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { WebsiteConfigService } from './website-config.service';
import {
  CreateWebsiteCountryDto,
  UpdateWebsiteCountryDto,
  CreateWebsiteCityDto,
  UpdateWebsiteCityDto,
  CreateWebsiteHotelDto,
  UpdateWebsiteHotelDto,
} from '../../shared/DTO/website-config.dto';

@Controller('website-configs')
export class WebsiteConfigController {
  constructor(private readonly configService: WebsiteConfigService) {}

  @Post('seed')
  async seed() {
    return this.configService.seedData();
  }

  @Post('countries')
  async createCountry(
    @Body() data: CreateWebsiteCountryDto,
  ) {
    return this.configService.createCountry(data);
  }

  @Get('countries')
  async findAllCountries() {
    return this.configService.findAllCountries();
  }

  @Get('countries/:id')
  async findOneCountry(
    @Param('id') id: string,
  ) {
    return this.configService.findOneCountry(id);
  }

  @Put('countries/:id')
  async updateCountry(
    @Param('id') id: string,
    @Body() data: UpdateWebsiteCountryDto,
  ) {
    return this.configService.updateCountry(id, data);
  }

  @Delete('countries/:id')
  async deleteCountry(
    @Param('id') id: string,
  ) {
    return this.configService.deleteCountry(id);
  }

  @Post('cities')
  async createCity(
    @Body() data: CreateWebsiteCityDto,
  ) {
    return this.configService.createCity(data);
  }

  @Get('cities')
  async findAllCities(
    @Query('countryId') countryId: string,
  ) {
    return this.configService.findAllCities(countryId);
  }

  @Get('cities/:id')
  async findOneCity(
    @Param('id') id: string,
  ) {
    return this.configService.findOneCity(id);
  }

  @Put('cities/:id')
  async updateCity(
    @Param('id') id: string,
    @Body() data: UpdateWebsiteCityDto,
  ) {
    return this.configService.updateCity(id, data);
  }

  @Delete('cities/:id')
  async deleteCity(
    @Param('id') id: string,
  ) {
    return this.configService.deleteCity(id);
  }

  @Post('hotels')
  async createHotel(
    @Body() data: CreateWebsiteHotelDto,
  ) {
    return this.configService.createHotel(data);
  }

  @Get('hotels')
  async findAllHotels(
    @Query('cityId') cityId: string,
  ) {
    return this.configService.findAllHotels(cityId);
  }

  @Get('hotels/:id')
  async findOneHotel(
    @Param('id') id: string,
  ) {
    return this.configService.findOneHotel(id);
  }

  @Put('hotels/:id')
  async updateHotel(
    @Param('id') id: string,
    @Body() data: UpdateWebsiteHotelDto,
  ) {
    return this.configService.updateHotel(id, data);
  }

  @Delete('hotels/:id')
  async deleteHotel(
    @Param('id') id: string,
  ) {
    return this.configService.deleteHotel(id);
  }
}
