import {
    Controller,
    Get,
    Post,
    Put,
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
} from 'src/shared/DTO/eventHotel.dto';

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
    async update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
        return await this.eventService.update(id, updateEventDto);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return await this.eventService.delete(id);
    }

    // Traveler endpoints
    @Post(':id/travelers')
    async addTravelers(
        @Param('id') id: string,
        @Body() addTravelerDto: AddTravelerDto,
    ) {
        return await this.eventService.addTravelers(id, addTravelerDto);
    }

    @Put(':id/travelers/:travelerId')
    async updateTraveler(
        @Param('id') eventId: string,
        @Param('travelerId') travelerId: string,
        @Body() travelerData: EventTravelerDto,
    ) {
        return await this.eventService.updateTraveler(eventId, travelerId, travelerData);
    }

    @Delete(':id/travelers/:travelerId')
    async removeTraveler(
        @Param('id') eventId: string,
        @Param('travelerId') travelerId: string,
    ) {
        return await this.eventService.removeTraveler(eventId, travelerId);
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
