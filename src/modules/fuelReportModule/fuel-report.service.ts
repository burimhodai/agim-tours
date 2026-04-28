import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FuelReport, FuelReportDocument } from './entities/fuel-report.entity';
import { CreateFuelReportDto } from './dto/create-fuel-report.dto';
import { FuelReportQueryDto } from './dto/fuel-report-query.dto';

@Injectable()
export class FuelReportService {
  constructor(
    @InjectModel(FuelReport.name)
    private fuelReportModel: Model<FuelReportDocument>,
  ) {}

  async create(createFuelReportDto: CreateFuelReportDto) {
    const d = new Date(createFuelReportDto.date);
    d.setUTCHours(0, 0, 0, 0);
    const report = new this.fuelReportModel({
      ...createFuelReportDto,
      date: d,
    });
    return report.save();
  }

  async findAll(query: FuelReportQueryDto) {
    const filter: any = {};

    if (query.date_from || query.date_to) {
      filter.date = {};
      if (query.date_from) {
        const d = new Date(query.date_from);
        d.setUTCHours(0, 0, 0, 0);
        filter.date.$gte = d;
      }
      if (query.date_to) {
        const d = new Date(query.date_to);
        d.setUTCHours(23, 59, 59, 999);
        filter.date.$lte = d;
      }
    }

    if (query.bus) {
      filter.bus = query.bus;
    }

    if (query.driver) {
      filter.driver = query.driver;
    }

    if (query.agency) {
      filter.agency = query.agency;
    }

    return this.fuelReportModel.find(filter).sort({ date: -1 }).exec();
  }

  async getSummary(query: FuelReportQueryDto) {
    const filter: any = {};

    if (query.date_from || query.date_to) {
      filter.date = {};
      if (query.date_from) {
        const d = new Date(query.date_from);
        d.setUTCHours(0, 0, 0, 0);
        filter.date.$gte = d;
      }
      if (query.date_to) {
        const d = new Date(query.date_to);
        d.setUTCHours(23, 59, 59, 999);
        filter.date.$lte = d;
      }
    }

    if (query.bus) {
      filter.bus = query.bus;
    }

    if (query.driver) {
      filter.driver = query.driver;
    }

    if (query.agency) {
      filter.agency = query.agency;
    }

    const reports = await this.fuelReportModel.find(filter).exec();

    const summary = {
      nafta: reports.reduce((sum, r) => sum + r.nafta, 0),
      litra: reports.reduce((sum, r) => sum + r.litra, 0),
      count: reports.length,
    };

    return summary;
  }

  async findOne(id: string) {
    const report = await this.fuelReportModel.findById(id).exec();
    if (!report) {
      throw new NotFoundException('Fuel report not found');
    }
    return report;
  }

  async remove(id: string) {
    const report = await this.fuelReportModel.findByIdAndDelete(id).exec();
    if (!report) {
      throw new NotFoundException('Fuel report not found');
    }
    return report;
  }
}
