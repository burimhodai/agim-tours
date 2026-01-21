import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { LoyalCustomerService } from './loyal-customer.service';

@Controller('loyal-customers')
export class LoyalCustomerController {
  constructor(private readonly loyalCustomerService: LoyalCustomerService) {}

  @Post()
  async create(@Body() data: any, @Req() req: any) {
    return this.loyalCustomerService.create(data, req.user);
  }

  @Get()
  async findAll(@Req() req: any) {
    return this.loyalCustomerService.findAll(req.user);
  }

  @Get('search')
  async search(
    @Query('q') query: string,
    @Query('limit') limit: string,
    @Req() req: any,
  ) {
    const searchLimit = limit ? parseInt(limit, 10) : 10;
    return this.loyalCustomerService.search(query || '', req.user, searchLimit);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.loyalCustomerService.findOne(id, req.user);
  }

  @Get(':id/stats')
  async getStats(@Param('id') id: string, @Req() req: any) {
    return this.loyalCustomerService.getCustomerStats(id, req.user);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    return this.loyalCustomerService.update(id, data, req.user);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: any) {
    return this.loyalCustomerService.delete(id, req.user);
  }

  @Post(':id/purchases')
  async addPurchase(
    @Param('id') id: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    return this.loyalCustomerService.addPurchase(id, data, req.user);
  }
}
