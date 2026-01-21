import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { TransactionServiceService } from './transaction-service.service';
import {
  CreateTransactionDto,
  TransactionQueryDto,
} from 'src/shared/DTO/transaction.dto';

@Controller('transactions')
export class TransactionControllerController {
  constructor(private readonly transactionService: TransactionServiceService) {}

  @Post()
  async create(@Body() createTransactionDto: CreateTransactionDto) {
    return await this.transactionService.create(createTransactionDto);
  }

  @Get()
  async findAll(@Query() query: TransactionQueryDto) {
    return await this.transactionService.findAll(query);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return await this.transactionService.findById(id);
  }
}
