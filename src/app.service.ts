import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IAgency } from './shared/types/agency.types';
import { CreateAgencyDto } from './shared/DTO/agency.dto';

@Injectable()
export class AppService {
  constructor(
    @InjectModel('Agency') private agencyModel: Model<IAgency>,
  ) { }

  async createAgency(createAgencyDto: CreateAgencyDto): Promise<IAgency> {
    const newAgency = new this.agencyModel(createAgencyDto);
    return await newAgency.save();
  }

  async getAllAgencies(): Promise<IAgency[]> {
    return await this.agencyModel.find().sort({ createdAt: -1 }).exec();
  }

  async updateAgency(id: string, data: Partial<CreateAgencyDto>): Promise<IAgency> {
    const agency = await this.agencyModel.findByIdAndUpdate(id, data, { new: true }).exec();
    if (!agency) {
      throw new Error('Agency not found');
    }
    return agency as IAgency;
  }

  async deleteAgency(id: string): Promise<void> {
    await this.agencyModel.findByIdAndDelete(id).exec();
  }
}