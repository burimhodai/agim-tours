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
import { PlaneService } from '../services/plane.service';
import {
  CreatePlaneTicketDto,
  UpdatePlaneTicketDto,
  AddPlaneLogDto,
  PlaneTicketQueryDto,
  CancelTicketDto,
} from 'src/shared/DTO/plane.dto';
import { PaymentStatusTypes } from 'src/shared/types/payment.types';

@Controller('plane')
export class PlaneController {
  constructor(private readonly planeService: PlaneService) { }

  @Post('tickets')
  async create(@Body() createPlaneTicketDto: CreatePlaneTicketDto) {
    return await this.planeService.create(createPlaneTicketDto);
  }

  @Get('tickets')
  async findAll(@Query() query: PlaneTicketQueryDto) {
    return await this.planeService.findAll(query);
  }

  @Get('tickets/booking/:bookingReference')
  async findByBookingReference(
    @Param('bookingReference') bookingReference: string,
  ) {
    return await this.planeService.findByBookingReference(bookingReference);
  }

  @Get('tickets/:id')
  async findById(@Param('id') id: string) {
    return await this.planeService.findById(id);
  }

  @Put('tickets/:id')
  async update(
    @Param('id') id: string,
    @Body() updatePlaneTicketDto: UpdatePlaneTicketDto,
  ) {
    return await this.planeService.update(id, updatePlaneTicketDto);
  }

  @Delete('tickets/:id')
  async delete(
    @Param('id') id: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return await this.planeService.delete(id, employeeId);
  }

  @Post('tickets/:id/logs')
  async addLog(@Param('id') id: string, @Body() addLogDto: AddPlaneLogDto) {
    return await this.planeService.addLog(id, addLogDto);
  }

  @Patch('tickets/:id/payment-status')
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body('payment_status') paymentStatus: PaymentStatusTypes,
    @Body('employee') employeeId?: string,
  ) {
    return await this.planeService.updatePaymentStatus(id, paymentStatus, employeeId);
  }

  @Patch('tickets/:id/check-in')
  async checkIn(
    @Param('id') id: string,
    @Body('checked_in') checkedIn: boolean,
    @Body('employee') employeeId?: string,
  ) {
    return await this.planeService.checkIn(id, checkedIn, employeeId);
  }

  @Patch('tickets/:id/cancel')
  async cancel(
    @Param('id') id: string,
    @Body() cancelTicketDto: CancelTicketDto,
  ) {
    return await this.planeService.cancel(id, cancelTicketDto);
  }

  @Patch('tickets/:id/refund')
  async refund(
    @Param('id') id: string,
    @Body() refundDto: CancelTicketDto,
  ) {
    return await this.planeService.refund(id, refundDto);
  }
}
