import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DriverReportService } from './driver-report.service';
import { CreateDriverReportDto } from './dto/create-driver-report.dto';
import { UpdateDriverReportDto } from './dto/update-driver-report.dto';
import { DriverReportQueryDto } from './dto/driver-report-query.dto';

@Controller('driver-reports')
export class DriverReportController {
  constructor(private readonly driverReportService: DriverReportService) { }

  @Post()
  create(@Body() createDriverReportDto: CreateDriverReportDto) {
    return this.driverReportService.create(createDriverReportDto);
  }

  @Get()
  findAll(@Query() query: DriverReportQueryDto) {
    return this.driverReportService.findAll(query);
  }

  @Get('summary')
  getSummary(@Query() query: DriverReportQueryDto) {
    return this.driverReportService.getSummary(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.driverReportService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDriverReportDto: UpdateDriverReportDto,
  ) {
    return this.driverReportService.update(id, updateDriverReportDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.driverReportService.remove(id);
  }
}
