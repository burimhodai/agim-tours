import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DriverReport, DriverReportDocument } from './entities/driver-report.entity';
import { CreateDriverReportDto } from './dto/create-driver-report.dto';
import { UpdateDriverReportDto } from './dto/update-driver-report.dto';
import { DriverReportQueryDto } from './dto/driver-report-query.dto';
import { TransactionServiceService } from 'src/transactions/transaction-service.service';
import { TransactionStatus, TransactionTypes } from 'src/shared/types/transaction.types';
import { CurrencyTypes } from 'src/shared/types/currency.types';

@Injectable()
export class DriverReportService {
  constructor(
    @InjectModel(DriverReport.name)
    private driverReportModel: Model<DriverReportDocument>,
    private transactionService: TransactionServiceService,
  ) { }

  async create(createDriverReportDto: CreateDriverReportDto) {
    const d = new Date(createDriverReportDto.date);
    d.setUTCHours(0, 0, 0, 0);
    const report = new this.driverReportModel({
      ...createDriverReportDto,
      date: d,
    });
    const savedReport = await report.save();

    await this.transactionService.create({
      amount: createDriverReportDto.promet,
      currency: CurrencyTypes.MKD,
      type: TransactionTypes.INCOME,
      status: TransactionStatus.SETTLED,
      user: createDriverReportDto.userId || createDriverReportDto.employee,
      driverReport: savedReport._id.toString(),
      description: `Promet nga raporti i shoferit - Bus: ${createDriverReportDto.bus}`,
    } as any);

    return savedReport;
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
      promet_linija: reports.reduce((sum, r) => sum + r.promet, 0),
      tur: reports.reduce((sum, r) => sum + r.tur, 0),
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

    if (updateDriverReportDto.promet !== undefined) {
      await this.transactionService.updateByDriverReport(id, {
        amount: updateDriverReportDto.promet,
      });
    }

    return report;
  }

  async remove(id: string) {
    const report = await this.driverReportModel.findByIdAndDelete(id).exec();
    if (!report) {
      throw new NotFoundException('Driver report not found');
    }

    await this.transactionService.deleteByDriverReport(id);

    return report;
  }
}
