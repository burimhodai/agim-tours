import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IOperator } from 'src/shared/types/hotel.types';
import {
    CreateOperatorDto,
    UpdateOperatorDto,
} from 'src/shared/DTO/hotel.dto';

@Injectable()
export class OperatorService {
    constructor(
        @InjectModel('Operator')
        private operatorModel: Model<IOperator>,
    ) { }

    async create(createOperatorDto: CreateOperatorDto): Promise<IOperator> {
        const operatorData = {
            ...createOperatorDto,
            agency: new Types.ObjectId(createOperatorDto.agency),
        };
        const operator = new this.operatorModel(operatorData);
        return await operator.save();
    }

    async findAll(agencyId?: string, type?: string): Promise<IOperator[]> {
        const filter: any = { isDeleted: false };
        // if (agencyId) {
        //     filter.agency = new Types.ObjectId(agencyId);
        // }
        if (type) {
            filter.type = type;
        }
        return await this.operatorModel
            .find(filter)
            .sort({ name: 1 })
            .exec();
    }

    async findById(id: string, agencyId: string): Promise<IOperator> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid operator ID');
        }

        const operator = await this.operatorModel
            .findOne({
                _id: id,
                agency: new Types.ObjectId(agencyId),
                isDeleted: false,
            })
            .exec();

        if (!operator) {
            throw new NotFoundException('Operator not found');
        }

        return operator;
    }

    async update(
        id: string,
        agencyId: string,
        updateOperatorDto: UpdateOperatorDto,
    ): Promise<IOperator> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid operator ID');
        }

        const operator = await this.operatorModel
            .findOneAndUpdate(
                { _id: id, agency: new Types.ObjectId(agencyId), isDeleted: false },
                { $set: updateOperatorDto },
                { new: true },
            )
            .exec();

        if (!operator) {
            throw new NotFoundException('Operator not found');
        }

        return operator;
    }

    async delete(id: string, agencyId: string): Promise<{ message: string }> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid operator ID');
        }

        const result = await this.operatorModel
            .findOneAndUpdate(
                { _id: id, agency: new Types.ObjectId(agencyId) },
                { $set: { isDeleted: true } },
            )
            .exec();

        if (!result) {
            throw new NotFoundException('Operator not found');
        }

        return { message: 'Operator deleted successfully' };
    }
}
