import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { OrganizedTravelService } from '../services/organizedTravel.service';
import {
  CreateOrganizedTravelDto,
  UpdateOrganizedTravelDto,
  OrganizedTravelQueryDto,
  AddOrganizedTravelersDto,
  AssignOrganizedBusDto,
  OrganizedTravelerDto,
  OrganizedPrintColumnsDto,
} from 'src/shared/DTO/organizedTravel.dto';
import { PaymentStatusTypes } from 'src/shared/types/payment.types';

@Controller('organized-travel')
export class OrganizedTravelController {
  constructor(private readonly travelService: OrganizedTravelService) { }

  @Post()
  async create(@Body() createDto: CreateOrganizedTravelDto) {
    return await this.travelService.create(createDto);
  }

  @Get()
  async findAll(@Query() query: OrganizedTravelQueryDto) {
    return await this.travelService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.travelService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrganizedTravelDto,
  ) {
    return await this.travelService.update(id, updateDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.travelService.delete(id);
  }

  @Patch(':id/reactivate')
  async reactivate(@Param('id') id: string) {
    return await this.travelService.reactivate(id);
  }

  // Traveler endpoints
  @Post(':id/travelers')
  async addTravelers(
    @Param('id') id: string,
    @Body() addTravelersDto: AddOrganizedTravelersDto,
    @Body('agency') performingAgencyId?: string,
  ) {
    return await this.travelService.addTravelers(id, addTravelersDto, performingAgencyId);
  }

  @Put(':id/travelers/:travelerId')
  async updateTraveler(
    @Param('id') travelId: string,
    @Param('travelerId') travelerId: string,
    @Body() travelerData: OrganizedTravelerDto,
    @Body('agency') performingAgencyId?: string,
  ) {
    return await this.travelService.updateTraveler(
      travelId,
      travelerId,
      travelerData,
      performingAgencyId,
    );
  }

  @Put(':id/travelers-group/:groupId')
  async updateTravelersGroup(
    @Param('id') travelId: string,
    @Param('groupId') groupId: string,
    @Body('travelers') travelers: OrganizedTravelerDto[],
    @Body('agency') performingAgencyId?: string,
  ) {
    return await this.travelService.updateTravelersGroup(
      travelId,
      groupId,
      travelers,
      performingAgencyId,
    );
  }

  @Delete(':id/travelers/:travelerId')
  async removeTraveler(
    @Param('id') travelId: string,
    @Param('travelerId') travelerId: string,
  ) {
    return await this.travelService.removeTraveler(travelId, travelerId);
  }

  // Update traveler payment status
  @Patch(':id/travelers/:travelerId/payment-status')
  async updateTravelerPaymentStatus(
    @Param('id') travelId: string,
    @Param('travelerId') travelerId: string,
    @Body('payment_status') paymentStatus: PaymentStatusTypes,
    @Body('paid_amount') paidAmount?: number,
    @Body('agency') performingAgencyId?: string,
  ) {
    return await this.travelService.updateTravelerPaymentStatus(
      travelId,
      travelerId,
      paymentStatus,
      paidAmount,
      performingAgencyId,
    );
  }

  // Bus assignment
  @Post(':id/assign-bus')
  async assignBus(
    @Param('id') travelId: string,
    @Body() assignBusDto: AssignOrganizedBusDto,
  ) {
    return await this.travelService.assignBus(travelId, assignBusDto);
  }

  // Get travelers grouped by bus
  @Get(':id/travelers-by-bus')
  async getTravelersByBus(@Param('id') travelId: string) {
    return await this.travelService.getTravelersByBus(travelId);
  }

  // Get filtered lists
  @Get(':id/border-list')
  async getBorderList(@Param('id') travelId: string) {
    return await this.travelService.getBorderList(travelId);
  }

  @Get(':id/guide-list')
  async getGuideList(@Param('id') travelId: string) {
    return await this.travelService.getGuideList(travelId);
  }

  // Update print columns
  @Put(':id/print-columns')
  async updatePrintColumns(
    @Param('id') travelId: string,
    @Body() printColumns: OrganizedPrintColumnsDto,
  ) {
    return await this.travelService.updatePrintColumns(travelId, printColumns);
  }
}
