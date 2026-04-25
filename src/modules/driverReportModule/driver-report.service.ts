import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DriverReport, DriverReportDocument } from './entities/driver-report.entity';
import { CreateDriverReportDto } from './dto/create-driver-report.dto';
import { UpdateDriverReportDto } from './dto/update-driver-report.dto';
import { DriverReportQueryDto } from './dto/driver-report-query.dto';

@Injectable()
export class DriverReportService {
  constructor(
    @InjectModel(DriverReport.name)
    private driverReportModel: Model<DriverReportDocument>,
  ) {}

  async create(createDriverReportDto: CreateDriverReportDto) {
    const d = new Date(createDriverReportDto.date);
    d.setUTCHours(0, 0, 0, 0);
    const report = new this.driverReportModel({
      ...createDriverReportDto,
      date: d,
    });
    return report.save();
  }

  async findAll(query: DriverReportQueryDto) {
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

    return this.driverReportModel.find(filter).sort({ date: -1 }).exec();
  }

  async getSummary(query: DriverReportQueryDto) {
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

    const reports = await this.driverReportModel.find(filter).exec();

    const summary = {
      nafta: reports.reduce((sum, r) => sum + r.nafta, 0),
      promet_linija: reports.reduce((sum, r) => sum + r.promet, 0),
      tur: reports.reduce((sum, r) => sum + r.tur, 0),
      litra: reports.reduce((sum, r) => sum + r.litra, 0),
      count: reports.length,
    };

    return summary;
  }

  async findOne(id: string) {
    const report = await this.driverReportModel.findById(id).exec();
    if (!report) {
      throw new NotFoundException('Driver report not found');
    }
    return report;
  }

  async update(id: string, updateDriverReportDto: UpdateDriverReportDto) {
    const data: any = { ...updateDriverReportDto };
    if (data.date) {
      const d = new Date(data.date);
      d.setUTCHours(0, 0, 0, 0);
      data.date = d;
    }

    const report = await this.driverReportModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
    if (!report) {
      throw new NotFoundException('Driver report not found');
    }
    return report;
  }

  async remove(id: string) {
    const report = await this.driverReportModel.findByIdAndDelete(id).exec();
    if (!report) {
      throw new NotFoundException('Driver report not found');
    }
    return report;
  }
}
