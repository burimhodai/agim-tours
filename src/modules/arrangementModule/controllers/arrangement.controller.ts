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
import { ArrangementService } from '../services/arrangement.service';
import {
  CreateArrangementDto,
  UpdateArrangementDto,
  ArrangementQueryDto,
} from 'src/shared/DTO/arrangement.dto';

@Controller('arrangements')
export class ArrangementController {
  constructor(private readonly arrangementService: ArrangementService) {}

  @Post()
  async create(@Body() createDto: CreateArrangementDto) {
    return await this.arrangementService.create(createDto);
  }

  @Get()
  async findAll(@Query() query: ArrangementQueryDto) {
    return await this.arrangementService.findAll(query);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return await this.arrangementService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateArrangementDto,
  ) {
    return await this.arrangementService.update(id, updateDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Query('employeeId') employeeId?: string) {
    return await this.arrangementService.delete(id, employeeId);
  }
}
