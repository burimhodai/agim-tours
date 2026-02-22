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
import { HotelReservationService } from '../services/hotel-reservation.service';
import {
  CreateHotelReservationDto,
  UpdateHotelReservationDto,
  AddReservationLogDto,
  HotelReservationQueryDto,
} from 'src/shared/DTO/hotel.dto';
import { ReservationStatus } from 'src/shared/types/hotel.types';

@Controller('hotel')
export class HotelReservationController {
  constructor(private readonly reservationService: HotelReservationService) { }

  @Post('reservations')
  async create(@Body() createReservationDto: CreateHotelReservationDto) {
    return await this.reservationService.create(createReservationDto);
  }

  @Get('reservations')
  async findAll(@Query() query: HotelReservationQueryDto) {
    return await this.reservationService.findAll(query);
  }

  @Get('reservations/stats/by-partner')
  async getStatsByPartner(@Query('agency') agencyId: string) {
    return await this.reservationService.getStatsByPartner(agencyId);
  }

  @Get('reservations/booking/:bookingId')
  async findByBookingId(
    @Param('bookingId') bookingId: string,
    @Query('agency') agencyId?: string,
  ) {
    return await this.reservationService.findByBookingId(bookingId, agencyId);
  }

  @Get('reservations/:id')
  async findById(@Param('id') id: string, @Query('agency') agencyId?: string) {
    return await this.reservationService.findById(id, agencyId);
  }

  @Put('reservations/:id')
  async update(
    @Param('id') id: string,
    @Body() updateReservationDto: UpdateHotelReservationDto,
    @Query('agency') agencyId?: string,
  ) {
    return await this.reservationService.update(
      id,
      agencyId,
      updateReservationDto,
    );
  }

  @Delete('reservations/:id')
  async delete(@Param('id') id: string, @Query('agency') agencyId?: string) {
    return await this.reservationService.delete(id, agencyId);
  }

  @Post('reservations/:id/logs')
  async addLog(
    @Param('id') id: string,
    @Body() addLogDto: AddReservationLogDto,
    @Query('agency') agencyId?: string,
  ) {
    return await this.reservationService.addLog(id, agencyId, addLogDto);
  }

  @Patch('reservations/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ReservationStatus,
    @Query('agency') agencyId?: string,
  ) {
    return await this.reservationService.updateStatus(id, agencyId, status);
  }
}
