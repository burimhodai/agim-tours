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
import { BusService } from '../services/bus.service';
import {
  CreateBusTicketDto,
  UpdateBusTicketDto,
  AddLogDto,
  BusTicketQueryDto,
  CancelTicketDto,
} from 'src/shared/DTO/bus.dto';
import { PaymentStatusTypes } from 'src/shared/types/payment.types';

@Controller('bus')
export class BusController {
  constructor(private readonly busService: BusService) { }

  @Post('tickets')
  async create(@Body() createBusTicketDto: CreateBusTicketDto) {
    return await this.busService.create(createBusTicketDto);
  }

  @Get('tickets')
  async findAll(@Query() query: BusTicketQueryDto) {
    return await this.busService.findAll(query);
  }

  @Get('tickets/booking/:bookingReference')
  async findByBookingReference(
    @Param('bookingReference') bookingReference: string,
  ) {
    return await this.busService.findByBookingReference(bookingReference);
  }

  @Get('tickets/:id')
  async findById(@Param('id') id: string) {
    return await this.busService.findById(id);
  }

  @Put('tickets/:id')
  async update(
    @Param('id') id: string,
    @Body() updateBusTicketDto: UpdateBusTicketDto,
  ) {
    return await this.busService.update(id, updateBusTicketDto);
  }

  @Delete('tickets/:id')
  async delete(
    @Param('id') id: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return await this.busService.delete(id, employeeId);
  }

  @Post('tickets/:id/logs')
  async addLog(@Param('id') id: string, @Body() addLogDto: AddLogDto) {
    return await this.busService.addLog(id, addLogDto);
  }

  @Patch('tickets/:id/payment-status')
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body('payment_status') paymentStatus: PaymentStatusTypes,
    @Body('employee') employeeId?: string,
  ) {
    return await this.busService.updatePaymentStatus(id, paymentStatus, employeeId);
  }

  @Patch('tickets/:id/check-in')
  async checkIn(
    @Param('id') id: string,
    @Body('checked_in') checkedIn: boolean,
    @Body('employee') employeeId?: string,
  ) {
    return await this.busService.checkIn(id, checkedIn, employeeId);
  }

  @Patch('tickets/:id/cancel')
  async cancel(
    @Param('id') id: string,
    @Body() cancelTicketDto: CancelTicketDto,
  ) {
    return await this.busService.cancel(id, cancelTicketDto);
  }

  @Patch('tickets/:id/refund')
  async refund(
    @Param('id') id: string,
    @Body() refundDto: CancelTicketDto,
  ) {
    return await this.busService.refund(id, refundDto);
  }
}
