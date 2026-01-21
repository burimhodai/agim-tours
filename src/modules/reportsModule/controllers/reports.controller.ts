import { Controller, Get, Post, Query } from '@nestjs/common';
import { ReportsService } from '../services/reports.service';
import { SeedDataService } from '../services/seed-data.service';
import { ReportQueryDto } from 'src/shared/DTO/report.dto';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly seedDataService: SeedDataService,
  ) {}

  @Get()
  async generateReport(@Query() query: ReportQueryDto) {
    return await this.reportsService.generateReport(query);
  }

  @Post('seed')
  async seedData() {
    return await this.seedDataService.seedReportData();
  }

  @Post('clear')
  async clearData() {
    return await this.seedDataService.clearReportData();
  }
}
