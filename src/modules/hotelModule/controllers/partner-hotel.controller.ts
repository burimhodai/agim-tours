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
import { PartnerHotelService } from '../services/partner-hotel.service';
import {
  CreatePartnerHotelDto,
  UpdatePartnerHotelDto,
  PartnerHotelQueryDto,
} from 'src/shared/DTO/hotel.dto';

@Controller('hotel')
export class PartnerHotelController {
  constructor(private readonly partnerHotelService: PartnerHotelService) { }

  @Post('partners')
  async create(@Body() createPartnerHotelDto: CreatePartnerHotelDto) {
    return await this.partnerHotelService.create(createPartnerHotelDto);
  }

  @Get('partners')
  async findAll(@Query() query: PartnerHotelQueryDto) {
    return await this.partnerHotelService.findAll(query);
  }

  @Get('partners/active')
  async findAllActive(@Query('agency') agencyId: string) {
    return await this.partnerHotelService.findAllActive(agencyId);
  }

  @Get('partners/:id')
  async findById(@Param('id') id: string, @Query('agency') agencyId?: string) {
    return await this.partnerHotelService.findById(id, agencyId);
  }

  @Patch('partners/:id')
  async update(
    @Param('id') id: string,
    @Body() updatePartnerHotelDto: UpdatePartnerHotelDto,
    @Query('agency') agencyId?: string,
  ) {
    return await this.partnerHotelService.update(
      id,
      agencyId,
      updatePartnerHotelDto,
    );
  }

  @Patch('partners/:id/toggle-active')
  async toggleActive(
    @Param('id') id: string,
    @Query('agency') agencyId?: string,
  ) {
    return await this.partnerHotelService.toggleActive(id, agencyId);
  }

  @Delete('partners/:id')
  async delete(@Param('id') id: string, @Query('agency') agencyId?: string) {
    return await this.partnerHotelService.delete(id, agencyId);
  }
}
