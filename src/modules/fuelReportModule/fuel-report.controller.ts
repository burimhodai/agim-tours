import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { FuelReportService } from './fuel-report.service';
import { CreateFuelReportDto } from './dto/create-fuel-report.dto';
import { FuelReportQueryDto } from './dto/fuel-report-query.dto';

@Controller('fuel-reports')
export class FuelReportController {
  constructor(private readonly fuelReportService: FuelReportService) {}

  @Post()
  create(@Body() createFuelReportDto: CreateFuelReportDto) {
    return this.fuelReportService.create(createFuelReportDto);
  }

  @Get()
  findAll(@Query() query: FuelReportQueryDto) {
    return this.fuelReportService.findAll(query);
  }

  @Get('summary')
  getSummary(@Query() query: FuelReportQueryDto) {
    return this.fuelReportService.getSummary(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fuelReportService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fuelReportService.remove(id);
  }
}
