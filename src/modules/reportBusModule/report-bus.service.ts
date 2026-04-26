import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ReportBus, ReportBusDocument } from './entities/report-bus.entity';
import { CreateReportBusDto } from './dto/create-report-bus.dto';
import { UpdateReportBusDto } from './dto/update-report-bus.dto';

@Injectable()
export class ReportBusService {
  constructor(
    @InjectModel(ReportBus.name)
    private reportBusModel: Model<ReportBusDocument>,
  ) {}

  async create(createReportBusDto: CreateReportBusDto) {
    const reportBus = new this.reportBusModel(createReportBusDto);
    return reportBus.save();
  }

  async findAll() {
    return this.reportBusModel.find().sort({ name: 1 }).exec();
  }

  async findOne(id: string) {
    const reportBus = await this.reportBusModel.findById(id).exec();
    if (!reportBus) {
      throw new NotFoundException('Report Bus not found');
    }
    return reportBus;
  }

  async update(id: string, updateReportBusDto: UpdateReportBusDto) {
    const reportBus = await this.reportBusModel
      .findByIdAndUpdate(id, updateReportBusDto, { new: true })
      .exec();
    if (!reportBus) {
      throw new NotFoundException('Report Bus not found');
    }
    return reportBus;
  }

  async remove(id: string) {
    const reportBus = await this.reportBusModel.findByIdAndDelete(id).exec();
    if (!reportBus) {
      throw new NotFoundException('Report Bus not found');
    }
    return reportBus;
  }
}
