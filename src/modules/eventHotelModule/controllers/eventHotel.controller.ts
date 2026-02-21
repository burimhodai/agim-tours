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
import { EventHotelService } from '../services/eventHotel.service';
import {
  CreateEventDto,
  UpdateEventDto,
  EventQueryDto,
  AddTravelerDto,
  AssignBusDto,
  EventTravelerDto,
  PrintColumnsDto,
  RefundTravelerDto,
} from 'src/shared/DTO/eventHotel.dto';
import { PaymentStatusTypes } from 'src/shared/types/payment.types';

@Controller('events')
export class EventHotelController {
  constructor(private readonly eventService: EventHotelService) { }

  @Post()
  async create(@Body() createEventDto: CreateEventDto) {
    return await this.eventService.create(createEventDto);
  }

  @Get()
  async findAll(@Query() query: EventQueryDto) {
    return await this.eventService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.eventService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return await this.eventService.update(id, updateEventDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.eventService.delete(id);
  }

  @Patch(':id/reactivate')
  async reactivate(@Param('id') id: string) {
    return await this.eventService.reactivate(id);
  }

  // Traveler endpoints
  @Post(':id/travelers')
  async addTravelers(
    @Param('id') id: string,
    @Body() addTravelerDto: AddTravelerDto,
    @Body('agency') performingAgencyId?: string,
    @Body('employee') employeeId?: string,
  ) {
    return await this.eventService.addTravelers(id, addTravelerDto, performingAgencyId, employeeId);
  }

  @Put(':id/travelers/:travelerId')
  async updateTraveler(
    @Param('id') eventId: string,
    @Param('travelerId') travelerId: string,
    @Body() travelerData: EventTravelerDto,
    @Body('agency') performingAgencyId?: string,
    @Body('employee') employeeId?: string,
  ) {
    return await this.eventService.updateTraveler(
      eventId,
      travelerId,
      travelerData,
      performingAgencyId,
      employeeId,
    );
  }

  @Put(':id/travelers-group/:groupId')
  async updateTravelersGroup(
    @Param('id') eventId: string,
    @Param('groupId') groupId: string,
    @Body('travelers') travelers: EventTravelerDto[],
    @Body('agency') performingAgencyId?: string,
    @Body('employee') employeeId?: string,
  ) {
    return await this.eventService.updateTravelersGroup(
      eventId,
      groupId,
      travelers,
      performingAgencyId,
      employeeId,
    );
  }

  @Delete(':id/travelers/:travelerId')
  async removeTraveler(
    @Param('id') eventId: string,
    @Param('travelerId') travelerId: string,
    @Query('employee') employeeId?: string,
  ) {
    return await this.eventService.removeTraveler(eventId, travelerId, employeeId);
  }

  @Patch(':id/travelers/:travelerId/reactivate')
  async reactivateTraveler(
    @Param('id') eventId: string,
    @Param('travelerId') travelerId: string,
    @Query('employee') employeeId?: string,
  ) {
    return await this.eventService.reactivateTraveler(eventId, travelerId, employeeId);
  }

  @Post(':id/refund-travelers')
  async refundTravelers(
    @Param('id') eventId: string,
    @Body() refundDto: RefundTravelerDto,
  ) {
    return await this.eventService.refundTravelers(eventId, refundDto);
  }

  // Update traveler payment status
  @Patch(':id/travelers/:travelerId/payment-status')
  async updateTravelerPaymentStatus(
    @Param('id') eventId: string,
    @Param('travelerId') travelerId: string,
    @Body('payment_status') paymentStatus: PaymentStatusTypes,
    @Body('paid_amount') paidAmount?: number,
    @Body('agency') performingAgencyId?: string,
    @Body('employee') employeeId?: string,
  ) {
    return await this.eventService.updateTravelerPaymentStatus(
      eventId,
      travelerId,
      paymentStatus,
      paidAmount,
      performingAgencyId,
      employeeId,
    );
  }

  // Bus assignment
  @Post(':id/assign-bus')
  async assignBus(
    @Param('id') eventId: string,
    @Body() assignBusDto: AssignBusDto,
  ) {
    return await this.eventService.assignBus(eventId, assignBusDto);
  }

  // Get travelers grouped by bus
  @Get(':id/travelers-by-bus')
  async getTravelersByBus(@Param('id') eventId: string) {
    return await this.eventService.getTravelersByBus(eventId);
  }

  // Get travelers grouped by hotel
  @Get(':id/travelers-by-hotel')
  async getTravelersByHotel(@Param('id') eventId: string) {
    return await this.eventService.getTravelersByHotel(eventId);
  }

  // Get filtered lists
  @Get(':id/hotel-list')
  async getHotelList(@Param('id') eventId: string) {
    return await this.eventService.getHotelList(eventId);
  }

  @Get(':id/border-list')
  async getBorderList(@Param('id') eventId: string) {
    return await this.eventService.getBorderList(eventId);
  }

  @Get(':id/guide-list')
  async getGuideList(@Param('id') eventId: string) {
    return await this.eventService.getGuideList(eventId);
  }

  // Update print columns
  @Put(':id/print-columns')
  async updatePrintColumns(
    @Param('id') eventId: string,
    @Body() printColumns: PrintColumnsDto,
  ) {
    return await this.eventService.updatePrintColumns(eventId, printColumns);
  }
}
