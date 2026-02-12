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
import { OperatorService } from '../services/operator.service';
import {
    CreateOperatorDto,
    UpdateOperatorDto,
} from 'src/shared/DTO/hotel.dto';

@Controller('operators')
export class OperatorController {
    constructor(private readonly operatorService: OperatorService) { }

    @Post()
    async create(@Body() createOperatorDto: CreateOperatorDto) {
        return await this.operatorService.create(createOperatorDto);
    }

    @Get()
    async findAll(@Query('agency') agencyId: string) {
        return await this.operatorService.findAll(agencyId);
    }

    @Get(':id')
    async findById(@Param('id') id: string, @Query('agency') agencyId: string) {
        return await this.operatorService.findById(id, agencyId);
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Query('agency') agencyId: string,
        @Body() updateOperatorDto: UpdateOperatorDto,
    ) {
        return await this.operatorService.update(
            id,
            agencyId,
            updateOperatorDto,
        );
    }

    @Delete(':id')
    async delete(@Param('id') id: string, @Query('agency') agencyId: string) {
        return await this.operatorService.delete(id, agencyId);
    }
}
