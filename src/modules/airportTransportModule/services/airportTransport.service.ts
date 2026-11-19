import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CreateAirportTransportDto,
  UpdateAirportTransportDto,
  AirportTransportQueryDto,
} from 'src/shared/DTO/airportTransport.dto';
import { CurrencyTypes } from 'src/shared/types/currency.types';
import { requireTransactionWorkspace } from 'src/transactions/transaction-workspace';
import { TransactionServiceService } from 'src/transactions/transaction-service.service';
import {
  TransactionTypes,
  TransactionStatus,
} from 'src/shared/types/transaction.types';

@Injectable()
export class AirportTransportService {
  constructor(
    @InjectModel('AirportTransport') private airportTransportModel: Model<any>,
    private transactionService: TransactionServiceService,
  ) {}

  async create(createDto: CreateAirportTransportDto) {
    const { agency, user } = requireTransactionWorkspace();
    const newTransport = new this.airportTransportModel({
      ...createDto,
      agency,
      employee: user,
    });
    const saved = await newTransport.save();

    await this.handleTransaction(saved);
    return saved;
  }

  async findAll(query: AirportTransportQueryDto) {
    const { search, startDate, endDate } = query;
    const filter: any = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { vehicle_name: { $regex: search, $options: 'i' } },
        { contact_person_name: { $regex: search, $options: 'i' } },
      ];
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    return this.airportTransportModel
      .find(filter)
      .sort({ date: -1 })
      .populate('agency')
      .populate('employee')
      .exec();
  }

  async findOne(id: string) {
    const transport = await this.airportTransportModel
      .findById(id)
      .populate('agency')
      .populate('employee')
      .exec();
    if (!transport)
      throw new NotFoundException('Transporti i aeroportit nuk u gjet');
    return transport;
  }

  async update(id: string, updateDto: UpdateAirportTransportDto) {
    const previous = await this.findOne(id);
    const { agency: _agency, employee: _employee, ...updates } = updateDto;
    const transport = await this.airportTransportModel
      .findByIdAndUpdate(id, updates, { new: true })
      .exec();
    if (!transport)
      throw new NotFoundException('Transporti i aeroportit nuk u gjet');

    await this.handleTransaction(transport, previous);
    return transport;
  }

  async remove(id: string) {
    const transport = await this.airportTransportModel
      .findByIdAndDelete(id)
      .exec();
    if (!transport)
      throw new NotFoundException('Transporti i aeroportit nuk u gjet');

    await this.transactionService.deleteByAirportTransport(id);
    return { message: 'U fshi me sukses' };
  }

  private async handleTransaction(
    transport: { _id: { toString(): string }; name: string; contact_person_name?: string; is_paid?: boolean; price?: number; currency?: CurrencyTypes },
    previous?: { is_paid?: boolean; price?: number; currency?: CurrencyTypes },
  ) {
    const amounts = new Map<CurrencyTypes, number>();
    if (previous?.is_paid) {
      amounts.set(previous.currency || CurrencyTypes.EURO, -(previous.price || 0));
    }
    if (transport.is_paid) {
      const currency = transport.currency || CurrencyTypes.EURO;
      amounts.set(currency, (amounts.get(currency) || 0) + (transport.price || 0));
    }

    for (const [currency, amount] of amounts) {
      if (amount === 0) continue;
      await this.transactionService.create({
        amount: Math.abs(amount),
        currency,
        type: amount > 0 ? TransactionTypes.INCOME : TransactionTypes.OUTCOME,
        status: TransactionStatus.SETTLED,
        airportTransport: transport._id.toString(),
        description: `Airport Transport: ${transport.name}`,
        to: transport.contact_person_name || transport.name,
      });
    }
  }
}
