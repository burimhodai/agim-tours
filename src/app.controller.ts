import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
} from '@nestjs/common';
import { AppService } from './app.service';
import { CreateAgencyDto } from './shared/DTO/agency.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('agencies')
  async createAgency(@Body() createAgencyDto: CreateAgencyDto) {
    return await this.appService.createAgency(createAgencyDto);
  }

  @Get('agencies')
  async getAllAgencies() {
    return await this.appService.getAllAgencies();
  }

  @Patch('agencies/:id')
  async updateAgency(
    @Param('id') id: string,
    @Body() data: Partial<CreateAgencyDto>,
  ) {
    return await this.appService.updateAgency(id, data);
  }

  @Delete('agencies/:id')
  async deleteAgency(@Param('id') id: string) {
    return await this.appService.deleteAgency(id);
  }
}
