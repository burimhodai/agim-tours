import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { LuggageService } from './luggage.service';

@Controller('luggage-types')
export class LuggageController {
  constructor(private readonly luggageService: LuggageService) {}

  @Get()
  async findAll(@Query('agency') agency: string) {
    return this.luggageService.findAll(agency);
  }

  @Post()
  async create(@Body() body: any) {
    return this.luggageService.create(body, body.agency);
  }
}
