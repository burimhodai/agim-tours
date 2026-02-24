import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { LuggageService } from './luggage.service';

@Controller('luggage-types')
export class LuggageController {
  constructor(private readonly luggageService: LuggageService) { }

  @Get()
  async findAll(@Query('agency') agency: string) {
    return this.luggageService.findAll(agency);
  }

  @Post()
  async create(@Body() body: any) {
    return this.luggageService.create(body, body.agency);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.luggageService.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.luggageService.remove(id);
  }
}
