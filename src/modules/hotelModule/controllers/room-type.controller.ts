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
import {
  CreateRoomTypeDto,
  UpdateRoomTypeDto,
  RoomTypeQueryDto,
} from 'src/shared/DTO/hotel.dto';

@Controller('hotel')
export class RoomTypeController {
  constructor(private readonly roomTypeService: RoomTypeService) { }

  @Post('room-types')
  async create(@Body() createRoomTypeDto: CreateRoomTypeDto) {
    return await this.roomTypeService.create(createRoomTypeDto);
  }

  @Get('room-types')
  async findAll(@Query() query: RoomTypeQueryDto) {
    return await this.roomTypeService.findAll(query);
  }

  @Get('room-types/:id')
  async findById(@Param('id') id: string, @Query('agency') agencyId?: string) {
    return await this.roomTypeService.findById(id, agencyId);
  }

  @Patch('room-types/:id')
  async update(
    @Param('id') id: string,
    @Body() updateRoomTypeDto: UpdateRoomTypeDto,
    @Query('agency') agencyId?: string,
  ) {
    return await this.roomTypeService.update(id, agencyId, updateRoomTypeDto);
  }

  @Delete('room-types/:id')
  async delete(@Param('id') id: string, @Query('agency') agencyId?: string) {
    return await this.roomTypeService.delete(id, agencyId);
  }
}
