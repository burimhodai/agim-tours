import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CreateEventBusDto,
  UpdateEventBusDto,
} from 'src/shared/DTO/eventHotel.dto';

export interface IEventBus {
  _id: Types.ObjectId;
  name: string;
  plates?: string;
  model?: string;
  drivers?: string[];
  capacity?: number;
  agency?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable()
export class EventBusService {
  constructor(@InjectModel('EventBus') private busModel: Model<IEventBus>) { }

  async create(createBusDto: CreateEventBusDto): Promise<IEventBus> {
    const busData = {
      ...createBusDto,
      agency: createBusDto.agency
        ? new Types.ObjectId(createBusDto.agency)
        : undefined,
    };

    const newBus = new this.busModel(busData);
    return await newBus.save();
  }

  async findAll(agencyId?: string): Promise<IEventBus[]> {
    const filter: any = {};

    /* if (agencyId) {
      filter.agency = new Types.ObjectId(agencyId);
    } */

    return await this.busModel
      .find(filter)
      .sort({ name: 1 })
      .populate('agency')
      .exec();
  }

  async findOne(id: string): Promise<IEventBus> {
    const bus = await this.busModel.findById(id).populate('agency').exec();

    if (!bus) {
      throw new NotFoundException('Autobusi nuk u gjet');
    }

    return bus;
  }

  async findByName(name: string, agencyId?: string): Promise<IEventBus | null> {
    const filter: any = { name: { $regex: new RegExp(`^${name}$`, 'i') } };

    if (agencyId) {
      filter.agency = new Types.ObjectId(agencyId);
    }

    return await this.busModel.findOne(filter).exec();
  }

  async search(query: string, agencyId?: string): Promise<IEventBus[]> {
    const filter: any = {
      name: { $regex: query, $options: 'i' },
    };

    /* if (agencyId) {
      filter.agency = new Types.ObjectId(agencyId);
    } */

    return await this.busModel.find(filter).limit(10).sort({ name: 1 }).exec();
  }

  async update(
    id: string,
    updateBusDto: UpdateEventBusDto,
  ): Promise<IEventBus> {
    const bus = await this.busModel.findByIdAndUpdate(
      id,
      { $set: updateBusDto },
      { new: true },
    );

    if (!bus) {
      throw new NotFoundException('Autobusi nuk u gjet');
    }

    return bus;
  }

  async delete(id: string): Promise<{ message: string }> {
    const result = await this.busModel.findByIdAndDelete(id);

    if (!result) {
      throw new NotFoundException('Autobusi nuk u gjet');
    }

    return { message: 'Autobusi u fshi me sukses' };
  }

  // Check if bus has complete info (plates, model, drivers)
  async checkBusComplete(
    id: string,
  ): Promise<{ complete: boolean; missing: string[] }> {
    const bus = await this.findOne(id);
    const missing: string[] = [];

    if (!bus.plates) missing.push('plates');
    if (!bus.model) missing.push('model');
    if (!bus.drivers || bus.drivers.length === 0) missing.push('drivers');

    return {
      complete: missing.length === 0,
      missing,
    };
  }
}
