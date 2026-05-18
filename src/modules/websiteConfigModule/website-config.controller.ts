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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { WebsiteConfigService } from './website-config.service';
import {
  CreateWebsiteCountryDto,
  UpdateWebsiteCountryDto,
  CreateWebsiteCityDto,
  UpdateWebsiteCityDto,
  CreateWebsiteHotelDto,
  UpdateWebsiteHotelDto,
  CreateWebsiteTopDestinationDto,
  UpdateWebsiteTopDestinationDto,
} from '../../shared/DTO/website-config.dto';

@ApiTags('Website Config')
@Controller('website-configs')
export class WebsiteConfigController {
  constructor(private readonly configService: WebsiteConfigService) {}

  @Post('seed')
  @ApiOperation({ summary: 'Seed initial country, city, and hotel data' })
  @ApiResponse({ status: 201, description: 'Database successfully seeded' })
  async seed() {
    return this.configService.seedData();
  }

  @Post('countries')
  @ApiOperation({ summary: 'Create a new country configuration' })
  @ApiResponse({ status: 201, description: 'Country successfully created' })
  async createCountry(
    @Body() data: CreateWebsiteCountryDto,
  ) {
    return this.configService.createCountry(data);
  }

  @Get('countries')
  @ApiOperation({ summary: 'Get all countries' })
  @ApiResponse({ status: 200, description: 'List of all active countries' })
  async findAllCountries() {
    return this.configService.findAllCountries();
  }

  @Get('countries/:id')
  @ApiOperation({ summary: 'Get a country by ID' })
  @ApiParam({ name: 'id', description: 'Country ID' })
  @ApiResponse({ status: 200, description: 'Country details' })
  async findOneCountry(
    @Param('id') id: string,
  ) {
    return this.configService.findOneCountry(id);
  }

  @Put('countries/:id')
  @ApiOperation({ summary: 'Update an existing country' })
  @ApiParam({ name: 'id', description: 'Country ID' })
  @ApiResponse({ status: 200, description: 'Country successfully updated' })
  async updateCountry(
    @Param('id') id: string,
    @Body() data: UpdateWebsiteCountryDto,
  ) {
    return this.configService.updateCountry(id, data);
  }

  @Delete('countries/:id')
  @ApiOperation({ summary: 'Soft-delete a country' })
  @ApiParam({ name: 'id', description: 'Country ID' })
  @ApiResponse({ status: 200, description: 'Country successfully soft-deleted' })
  async deleteCountry(
    @Param('id') id: string,
  ) {
    return this.configService.deleteCountry(id);
  }

  @Post('cities')
  @ApiOperation({ summary: 'Create a new city configuration' })
  @ApiResponse({ status: 201, description: 'City successfully created' })
  async createCity(
    @Body() data: CreateWebsiteCityDto,
  ) {
    return this.configService.createCity(data);
  }

  @Get('cities')
  @ApiOperation({ summary: 'Get all cities, optionally filtered by country' })
  @ApiQuery({ name: 'countryId', required: false, description: 'Optional country ID to filter cities' })
  @ApiResponse({ status: 200, description: 'List of active cities' })
  async findAllCities(
    @Query('countryId') countryId: string,
  ) {
    return this.configService.findAllCities(countryId);
  }

  @Get('cities/:id')
  @ApiOperation({ summary: 'Get a city by ID' })
  @ApiParam({ name: 'id', description: 'City ID' })
  @ApiResponse({ status: 200, description: 'City details' })
  async findOneCity(
    @Param('id') id: string,
  ) {
    return this.configService.findOneCity(id);
  }

  @Put('cities/:id')
  @ApiOperation({ summary: 'Update an existing city' })
  @ApiParam({ name: 'id', description: 'City ID' })
  @ApiResponse({ status: 200, description: 'City successfully updated' })
  async updateCity(
    @Param('id') id: string,
    @Body() data: UpdateWebsiteCityDto,
  ) {
    return this.configService.updateCity(id, data);
  }

  @Delete('cities/:id')
  @ApiOperation({ summary: 'Soft-delete a city' })
  @ApiParam({ name: 'id', description: 'City ID' })
  @ApiResponse({ status: 200, description: 'City successfully soft-deleted' })
  async deleteCity(
    @Param('id') id: string,
  ) {
    return this.configService.deleteCity(id);
  }

  @Post('hotels')
  @ApiOperation({ summary: 'Create a new hotel configuration' })
  @ApiResponse({ status: 201, description: 'Hotel successfully created' })
  async createHotel(
    @Body() data: CreateWebsiteHotelDto,
  ) {
    return this.configService.createHotel(data);
  }

  @Get('hotels')
  @ApiOperation({ summary: 'Get all hotels, optionally filtered by city' })
  @ApiQuery({ name: 'cityId', required: false, description: 'Optional city ID to filter hotels' })
  @ApiResponse({ status: 200, description: 'List of active hotels' })
  async findAllHotels(
    @Query('cityId') cityId: string,
  ) {
    return this.configService.findAllHotels(cityId);
  }

  @Get('hotels/:id')
  @ApiOperation({ summary: 'Get a hotel by ID' })
  @ApiParam({ name: 'id', description: 'Hotel ID' })
  @ApiResponse({ status: 200, description: 'Hotel details' })
  async findOneHotel(
    @Param('id') id: string,
  ) {
    return this.configService.findOneHotel(id);
  }

  @Put('hotels/:id')
  @ApiOperation({ summary: 'Update an existing hotel' })
  @ApiParam({ name: 'id', description: 'Hotel ID' })
  @ApiResponse({ status: 200, description: 'Hotel successfully updated' })
  async updateHotel(
    @Param('id') id: string,
    @Body() data: UpdateWebsiteHotelDto,
  ) {
    return this.configService.updateHotel(id, data);
  }

  @Delete('hotels/:id')
  @ApiOperation({ summary: 'Soft-delete a hotel' })
  @ApiParam({ name: 'id', description: 'Hotel ID' })
  @ApiResponse({ status: 200, description: 'Hotel successfully soft-deleted' })
  async deleteHotel(
    @Param('id') id: string,
  ) {
    return this.configService.deleteHotel(id);
  }

  @Post('top-destinations')
  @ApiOperation({ summary: 'Create a new top destination configuration' })
  @ApiResponse({ status: 201, description: 'Top destination successfully created' })
  async createTopDestination(
    @Body() data: CreateWebsiteTopDestinationDto,
  ) {
    return this.configService.createTopDestination(data);
  }

  @Get('top-destinations')
  @ApiOperation({ summary: 'Get all top destinations' })
  @ApiResponse({ status: 200, description: 'List of active top destinations' })
  async findAllTopDestinations() {
    return this.configService.findAllTopDestinations();
  }

  @Get('top-destinations/:id')
  @ApiOperation({ summary: 'Get a top destination by ID' })
  @ApiParam({ name: 'id', description: 'Top Destination ID' })
  @ApiResponse({ status: 200, description: 'Top destination details' })
  async findOneTopDestination(
    @Param('id') id: string,
  ) {
    return this.configService.findOneTopDestination(id);
  }

  @Put('top-destinations/:id')
  @ApiOperation({ summary: 'Update an existing top destination' })
  @ApiParam({ name: 'id', description: 'Top Destination ID' })
  @ApiResponse({ status: 200, description: 'Top destination successfully updated' })
  async updateTopDestination(
    @Param('id') id: string,
    @Body() data: UpdateWebsiteTopDestinationDto,
  ) {
    return this.configService.updateTopDestination(id, data);
  }

  @Delete('top-destinations/:id')
  @ApiOperation({ summary: 'Soft-delete a top destination' })
  @ApiParam({ name: 'id', description: 'Top Destination ID' })
  @ApiResponse({ status: 200, description: 'Top destination successfully soft-deleted' })
  async deleteTopDestination(
    @Param('id') id: string,
  ) {
    return this.configService.deleteTopDestination(id);
  }
}
