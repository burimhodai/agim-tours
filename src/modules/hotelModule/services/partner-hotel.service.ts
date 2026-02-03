import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IPartnerHotel } from 'src/shared/types/hotel.types';
import {
  CreatePartnerHotelDto,
  UpdatePartnerHotelDto,
  PartnerHotelQueryDto,
} from 'src/shared/DTO/hotel.dto';

@Injectable()
export class PartnerHotelService {
  constructor(
    @InjectModel('PartnerHotel')
    private partnerHotelModel: Model<IPartnerHotel>,
  ) { }

  async create(
    createPartnerHotelDto: CreatePartnerHotelDto,
  ): Promise<IPartnerHotel> {
    const partnerHotelData = {
      ...createPartnerHotelDto,
      agency: new Types.ObjectId(createPartnerHotelDto.agency),
    };
    const partnerHotel = new this.partnerHotelModel(partnerHotelData);
    return await partnerHotel.save();
  }

  async findAll(query: PartnerHotelQueryDto): Promise<{
    partners: IPartnerHotel[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      name,
      city,
      country,
      is_active,
      agency,
      page = 1,
      limit = 10,
    } = query;

    const filter: any = {
      // agency: new Types.ObjectId(agency),
    };

    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }

    if (city) {
      filter.city = { $regex: city, $options: 'i' };
    }

    if (country) {
      filter.country = { $regex: country, $options: 'i' };
    }

    if (is_active !== undefined) {
      filter.is_active = is_active;
    }

    const skip = (page - 1) * limit;

    const [partners, total] = await Promise.all([
      this.partnerHotelModel
        .find(filter)
        .populate('agency')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.partnerHotelModel.countDocuments(filter).exec(),
    ]);

    return {
      partners,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAllActive(agencyId: string): Promise<IPartnerHotel[]> {
    return await this.partnerHotelModel
      .find({
        is_active: true,
        agency: new Types.ObjectId(agencyId),
      })
      .populate('agency')
      .sort({ name: 1 })
      .exec();
  }

  async findById(id: string, agencyId: string): Promise<IPartnerHotel> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid partner hotel ID');
    }

    const partnerHotel = await this.partnerHotelModel
      .findOne({
        _id: id,
        agency: new Types.ObjectId(agencyId),
      })
      .populate('agency')
      .exec();

    if (!partnerHotel) {
      throw new NotFoundException('Partner hotel not found');
    }

    return partnerHotel;
  }

  async update(
    id: string,
    agencyId: string,
    updatePartnerHotelDto: UpdatePartnerHotelDto,
  ): Promise<IPartnerHotel> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid partner hotel ID');
    }

    const partnerHotel = await this.partnerHotelModel
      .findOneAndUpdate(
        { _id: id, agency: new Types.ObjectId(agencyId) },
        { $set: updatePartnerHotelDto },
        { new: true },
      )
      .populate('agency')
      .exec();

    if (!partnerHotel) {
      throw new NotFoundException('Partner hotel not found');
    }

    return partnerHotel;
  }

  async delete(id: string, agencyId: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid partner hotel ID');
    }

    const result = await this.partnerHotelModel
      .findOneAndDelete({ _id: id, agency: new Types.ObjectId(agencyId) })
      .exec();

    if (!result) {
      throw new NotFoundException('Partner hotel not found');
    }

    return { message: 'Partner hotel deleted successfully' };
  }

  async toggleActive(id: string, agencyId: string): Promise<IPartnerHotel> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid partner hotel ID');
    }

    const partnerHotel = await this.partnerHotelModel
      .findOne({
        _id: id,
        agency: new Types.ObjectId(agencyId),
      })
      .exec();

    if (!partnerHotel) {
      throw new NotFoundException('Partner hotel not found');
    }

    partnerHotel.is_active = !partnerHotel.is_active;
    return await partnerHotel.save();
  }
}
