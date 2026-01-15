import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IRoomType } from 'src/shared/types/hotel.types';
import { CreateRoomTypeDto, UpdateRoomTypeDto, RoomTypeQueryDto } from 'src/shared/DTO/hotel.dto';

@Injectable()
export class RoomTypeService {
    constructor(
        @InjectModel('RoomType') private roomTypeModel: Model<IRoomType>,
    ) { }

    async create(createRoomTypeDto: CreateRoomTypeDto): Promise<IRoomType> {
        const roomTypeData = {
            ...createRoomTypeDto,
            agency: new Types.ObjectId(createRoomTypeDto.agency),
        };
        const roomType = new this.roomTypeModel(roomTypeData);
        return await roomType.save();
    }

    async findAll(query: RoomTypeQueryDto): Promise<IRoomType[]> {
        const filter: any = {};

        if (query.agency) {
            filter.agency = new Types.ObjectId(query.agency);
        }

        return await this.roomTypeModel
            .find(filter)
            .populate('agency')
            .sort({ name: 1 })
            .exec();
    }

    async findById(id: string, agencyId: string): Promise<IRoomType> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid room type ID');
        }

        const roomType = await this.roomTypeModel
            .findOne({
                _id: id,
                agency: new Types.ObjectId(agencyId)
            })
            .populate('agency')
            .exec();

        if (!roomType) {
            throw new NotFoundException('Room type not found');
        }

        return roomType;
    }

    async update(id: string, agencyId: string, updateRoomTypeDto: UpdateRoomTypeDto): Promise<IRoomType> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid room type ID');
        }

        const roomType = await this.roomTypeModel
            .findOneAndUpdate(
                { _id: id, agency: new Types.ObjectId(agencyId) },
                { $set: updateRoomTypeDto },
                { new: true }
            )
            .populate('agency')
            .exec();

        if (!roomType) {
            throw new NotFoundException('Room type not found');
        }

        return roomType;
    }

    async delete(id: string, agencyId: string): Promise<{ message: string }> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid room type ID');
        }

        const result = await this.roomTypeModel
            .findOneAndDelete({ _id: id, agency: new Types.ObjectId(agencyId) })
            .exec();

        if (!result) {
            throw new NotFoundException('Room type not found');
        }

        return { message: 'Room type deleted successfully' };
    }
}
