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

@Controller('hotel-reservations')
export class HotelReservationController {
    constructor(private readonly reservationService: HotelReservationService) { }

    @Post()
    async create(@Body() createReservationDto: CreateHotelReservationDto) {
        return await this.reservationService.create(createReservationDto);
    }

    @Get()
    async findAll(@Query() query: HotelReservationQueryDto) {
        return await this.reservationService.findAll(query);
    }

    @Get('stats/by-partner')
    async getStatsByPartner(@Query('agency') agencyId: string) {
        return await this.reservationService.getStatsByPartner(agencyId);
    }

    @Get('booking/:bookingId')
    async findByBookingId(
        @Param('bookingId') bookingId: string,
        @Query('agency') agencyId: string
    ) {
        return await this.reservationService.findByBookingId(bookingId, agencyId);
    }

    @Get(':id')
    async findById(
        @Param('id') id: string,
        @Query('agency') agencyId: string
    ) {
        return await this.reservationService.findById(id, agencyId);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Query('agency') agencyId: string,
        @Body() updateReservationDto: UpdateHotelReservationDto
    ) {
        return await this.reservationService.update(id, agencyId, updateReservationDto);
    }

    @Delete(':id')
    async delete(
        @Param('id') id: string,
        @Query('agency') agencyId: string
    ) {
        return await this.reservationService.delete(id, agencyId);
    }

    @Post(':id/logs')
    async addLog(
        @Param('id') id: string,
        @Query('agency') agencyId: string,
        @Body() addLogDto: AddReservationLogDto
    ) {
        return await this.reservationService.addLog(id, agencyId, addLogDto);
    }

    @Patch(':id/status')
    async updateStatus(
        @Param('id') id: string,
        @Query('agency') agencyId: string,
        @Body('status') status: ReservationStatus
    ) {
        return await this.reservationService.updateStatus(id, agencyId, status);
    }
}
