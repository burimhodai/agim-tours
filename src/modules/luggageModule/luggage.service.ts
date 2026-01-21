import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class LuggageService {
  constructor(@InjectModel('LuggageType') private luggageModel: Model<any>) {}

  async findAll(agencyId: string) {
    return this.luggageModel.find({ agency: agencyId }).exec();
  }

  async create(data: any, agencyId: string) {
    return this.luggageModel.create({ ...data, agency: agencyId });
  }
}
