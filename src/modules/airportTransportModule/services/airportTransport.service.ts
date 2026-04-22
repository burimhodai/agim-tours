import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateAirportTransportDto, UpdateAirportTransportDto, AirportTransportQueryDto } from 'src/shared/DTO/airportTransport.dto';
import { TransactionServiceService } from 'src/transactions/transaction-service.service';
import { TransactionTypes, TransactionStatus } from 'src/shared/types/transaction.types';

@Injectable()
export class AirportTransportService {
  constructor(
    @InjectModel('AirportTransport') private airportTransportModel: Model<any>,
    private transactionService: TransactionServiceService,
  ) {}

  async create(createDto: CreateAirportTransportDto) {
    const newTransport = new this.airportTransportModel(createDto);
    const saved = await newTransport.save();

    await this.handleTransaction(saved);
    return saved;
  }

  async findAll(query: AirportTransportQueryDto) {
    const { search, startDate, endDate, agency } = query;
    const filter: any = {};

    if (agency) {
      filter.agency = new Types.ObjectId(agency);
    }

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
    const transport = await this.airportTransportModel.findById(id).populate('agency').populate('employee').exec();
    if (!transport) throw new NotFoundException('Transporti i aeroportit nuk u gjet');
    return transport;
  }

  async update(id: string, updateDto: UpdateAirportTransportDto) {
    const transport = await this.airportTransportModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
    if (!transport) throw new NotFoundException('Transporti i aeroportit nuk u gjet');
    
    await this.handleTransaction(transport);
    return transport;
  }

  async remove(id: string) {
    const transport = await this.airportTransportModel.findByIdAndDelete(id).exec();
    if (!transport) throw new NotFoundException('Transporti i aeroportit nuk u gjet');
    
    await this.transactionService.deleteByAirportTransport(id);
    return { message: 'U fshi me sukses' };
  }

  private async handleTransaction(transport: any) {
    // Delete existing transactions for this transport
    await this.transactionService.deleteByAirportTransport(transport._id.toString());

    if (transport.price && transport.price > 0) {
      const type = transport.is_paid ? TransactionTypes.INCOME : TransactionTypes.DEBT;
      const status = transport.is_paid ? TransactionStatus.SETTLED : TransactionStatus.PENDING;

      await this.transactionService.create({
        amount: transport.price,
        currency: transport.currency,
        type: type,
        status: status,
        airportTransport: transport._id,
        agency: transport.agency,
        user: transport.employee,
        description: `Airport Transport: ${transport.name} ${transport.is_paid ? '(Paguar)' : '(Borxh)'}`,
        to: transport.contact_person_name || transport.name,
      });
    }
  }
}
