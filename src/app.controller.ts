import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { CreateAgencyDto } from './shared/DTO/agency.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Post('agencies')
  async createAgency(@Body() createAgencyDto: CreateAgencyDto) {
    return await this.appService.createAgency(createAgencyDto);
  }

  @Get('agencies')
  async getAllAgencies() {
    return await this.appService.getAllAgencies();
  }
}
