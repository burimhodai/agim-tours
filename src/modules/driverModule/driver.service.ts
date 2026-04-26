import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Driver, DriverDocument } from './entities/driver.entity';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';

@Injectable()
export class DriverService {
  constructor(
    @InjectModel(Driver.name)
    private driverModel: Model<DriverDocument>,
  ) {}

  async create(createDriverDto: CreateDriverDto) {
    const driver = new this.driverModel(createDriverDto);
    return driver.save();
  }

  async findAll() {
    return this.driverModel.find().sort({ name: 1 }).exec();
  }

  async findOne(id: string) {
    const driver = await this.driverModel.findById(id).exec();
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }
    return driver;
  }

  async update(id: string, updateDriverDto: UpdateDriverDto) {
    const driver = await this.driverModel
      .findByIdAndUpdate(id, updateDriverDto, { new: true })
      .exec();
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }
    return driver;
  }

  async remove(id: string) {
    const driver = await this.driverModel.findByIdAndDelete(id).exec();
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }
    return driver;
  }
}
