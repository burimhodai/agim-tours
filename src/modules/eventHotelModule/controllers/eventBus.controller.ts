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
import { EventBusService } from '../services/eventBus.service';
import { CreateEventBusDto, UpdateEventBusDto } from 'src/shared/DTO/eventHotel.dto';

@Controller('event-buses')
export class EventBusController {
    constructor(private readonly busService: EventBusService) { }

    @Post()
    async create(@Body() createBusDto: CreateEventBusDto) {
        return await this.busService.create(createBusDto);
    }

    @Get()
    async findAll(@Query('agency') agencyId?: string) {
        return await this.busService.findAll(agencyId);
    }

    @Get('search')
    async search(
        @Query('q') query: string,
        @Query('agency') agencyId?: string,
    ) {
        return await this.busService.search(query, agencyId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return await this.busService.findOne(id);
    }

    @Get(':id/check-complete')
    async checkComplete(@Param('id') id: string) {
        return await this.busService.checkBusComplete(id);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateBusDto: UpdateEventBusDto,
    ) {
        return await this.busService.update(id, updateBusDto);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return await this.busService.delete(id);
    }
}
