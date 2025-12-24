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
    async findByBookingReference(@Param('bookingReference') bookingReference: string) {
        return await this.busService.findByBookingReference(bookingReference);
    }

    @Get('tickets/:id')
    async findById(@Param('id') id: string) {
        return await this.busService.findById(id);
    }

    @Put('tickets/:id')
    async update(
        @Param('id') id: string,
        @Body() updateBusTicketDto: UpdateBusTicketDto
    ) {
        return await this.busService.update(id, updateBusTicketDto);
    }

    @Delete('tickets/:id')
    async delete(@Param('id') id: string) {
        return await this.busService.delete(id);
    }

    @Post('tickets/:id/logs')
    async addLog(@Param('id') id: string, @Body() addLogDto: AddLogDto) {
        return await this.busService.addLog(id, addLogDto);
    }

    @Patch('tickets/:id/payment-status')
    async updatePaymentStatus(
        @Param('id') id: string,
        @Body('payment_status') paymentStatus: PaymentStatusTypes
    ) {
        return await this.busService.updatePaymentStatus(id, paymentStatus);
    }

    @Patch('tickets/:id/check-in')
    async checkIn(
        @Param('id') id: string,
        @Body('checked_in') checkedIn: boolean
    ) {
        return await this.busService.checkIn(id, checkedIn);
    }
}
