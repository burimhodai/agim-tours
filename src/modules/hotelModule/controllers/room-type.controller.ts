import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
} from '@nestjs/common';
import { RoomTypeService } from '../services/room-type.service';
import { CreateRoomTypeDto, UpdateRoomTypeDto, RoomTypeQueryDto } from 'src/shared/DTO/hotel.dto';

@Controller('room-types')
export class RoomTypeController {
    constructor(private readonly roomTypeService: RoomTypeService) { }

    @Post()
    async create(@Body() createRoomTypeDto: CreateRoomTypeDto) {
        return await this.roomTypeService.create(createRoomTypeDto);
    }

    @Get()
    async findAll(@Query() query: RoomTypeQueryDto) {
        return await this.roomTypeService.findAll(query);
    }

    @Get(':id')
    async findById(
        @Param('id') id: string,
        @Query('agency') agencyId: string
    ) {
        return await this.roomTypeService.findById(id, agencyId);
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Query('agency') agencyId: string,
        @Body() updateRoomTypeDto: UpdateRoomTypeDto
    ) {
        return await this.roomTypeService.update(id, agencyId, updateRoomTypeDto);
    }

    @Delete(':id')
    async delete(
        @Param('id') id: string,
        @Query('agency') agencyId: string
    ) {
        return await this.roomTypeService.delete(id, agencyId);
    }
}
