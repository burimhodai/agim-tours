import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { AirportTransportService } from '../services/airportTransport.service';
import { CreateAirportTransportDto, UpdateAirportTransportDto, AirportTransportQueryDto } from 'src/shared/DTO/airportTransport.dto';

@Controller('airport-transport')
export class AirportTransportController {
  constructor(private readonly airportTransportService: AirportTransportService) {}

  @Post()
  create(@Body() createDto: CreateAirportTransportDto) {
    return this.airportTransportService.create(createDto);
  }

  @Get()
  findAll(@Query() query: AirportTransportQueryDto) {
    return this.airportTransportService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.airportTransportService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateAirportTransportDto) {
    return this.airportTransportService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.airportTransportService.remove(id);
  }
}
