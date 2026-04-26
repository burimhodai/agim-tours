import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ReportBusService } from './report-bus.service';
import { CreateReportBusDto } from './dto/create-report-bus.dto';
import { UpdateReportBusDto } from './dto/update-report-bus.dto';

@Controller('report-buses')
export class ReportBusController {
  constructor(private readonly reportBusService: ReportBusService) {}

  @Post()
  create(@Body() createReportBusDto: CreateReportBusDto) {
    return this.reportBusService.create(createReportBusDto);
  }

  @Get()
  findAll() {
    return this.reportBusService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reportBusService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReportBusDto: UpdateReportBusDto) {
    return this.reportBusService.update(id, updateReportBusDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reportBusService.remove(id);
  }
}
