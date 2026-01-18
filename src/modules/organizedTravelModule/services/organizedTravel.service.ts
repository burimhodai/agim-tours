import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
    CreateOrganizedTravelDto,
    UpdateOrganizedTravelDto,
    OrganizedTravelQueryDto,
    OrganizedTravelerDto,
    AddOrganizedTravelersDto,
    AssignOrganizedBusDto,
} from 'src/shared/DTO/organizedTravel.dto';

export interface IOrganizedTravel {
    _id: Types.ObjectId;
    uid?: string;
    name: string;
    location: string;
    date: Date;
    return_date?: Date;
    price?: number;
    currency?: string;
    payment_status?: string;
    travelers: any[];
    buses: Types.ObjectId[];
    print_columns?: any;
    employee?: Types.ObjectId;
    agency?: Types.ObjectId;
    logs?: any[];
    is_deleted?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

@Injectable()
export class OrganizedTravelService {
    constructor(
        @InjectModel('OrganizedTravel') private travelModel: Model<IOrganizedTravel>,
    ) { }

    private generateTravelUid(): string {
        const numDigits = Math.random() < 0.5 ? 5 : 6;
        const min = Math.pow(10, numDigits - 1);
        const max = Math.pow(10, numDigits) - 1;
        const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
        return `OT${randomNum}`;
    }

    async create(createDto: CreateOrganizedTravelDto): Promise<IOrganizedTravel> {
        const travelData = {
            ...createDto,
            uid: this.generateTravelUid(),
            agency: createDto.agency
                ? new Types.ObjectId(createDto.agency)
                : undefined,
            employee: createDto.employee
                ? new Types.ObjectId(createDto.employee)
                : undefined,
            buses: createDto.buses?.map((id) => new Types.ObjectId(id)) || [],
        };

        const newTravel = new this.travelModel(travelData);
        return await newTravel.save();
    }

    async findAll(query: OrganizedTravelQueryDto): Promise<{
        trips: IOrganizedTravel[];
        total: number;
        page: number;
        totalPages: number;
    }> {
        const { agency, search, page = 1, limit = 20 } = query;

        const filter: any = { is_deleted: { $ne: true } };

        if (agency) {
            filter.agency = new Types.ObjectId(agency);
        }

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } },
                { uid: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (page - 1) * limit;
        const total = await this.travelModel.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);

        const trips = await this.travelModel
            .find(filter)
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit)
            .populate('agency')
            .populate('employee')
            .populate('buses')
            .populate('travelers.bus')
            .exec();

        return { trips, total, page, totalPages };
    }

    async findOne(id: string): Promise<IOrganizedTravel> {
        const travel = await this.travelModel
            .findById(id)
            .populate('agency')
            .populate('employee')
            .populate('buses')
            .populate('travelers.bus')
            .exec();

        if (!travel || travel.is_deleted) {
            throw new NotFoundException('Udhëtimi nuk u gjet');
        }

        return travel;
    }

    async update(id: string, updateDto: UpdateOrganizedTravelDto): Promise<IOrganizedTravel> {
        const updateData: any = { ...updateDto };

        if (updateDto.buses) {
            updateData.buses = updateDto.buses.map((busId) => new Types.ObjectId(busId));
        }

        const travel = await this.travelModel
            .findByIdAndUpdate(id, { $set: updateData }, { new: true })
            .populate('agency')
            .populate('employee')
            .populate('buses')
            .populate('travelers.bus')
            .exec();

        if (!travel) {
            throw new NotFoundException('Udhëtimi nuk u gjet');
        }

        return travel;
    }

    async delete(id: string): Promise<{ message: string }> {
        const travel = await this.travelModel.findByIdAndUpdate(
            id,
            { $set: { is_deleted: true } },
            { new: true },
        );

        if (!travel) {
            throw new NotFoundException('Udhëtimi nuk u gjet');
        }

        return { message: 'Udhëtimi u fshi me sukses' };
    }

    async addTravelers(id: string, addTravelersDto: AddOrganizedTravelersDto): Promise<IOrganizedTravel> {
        const travel = await this.travelModel.findById(id);

        if (!travel) {
            throw new NotFoundException('Udhëtimi nuk u gjet');
        }

        const processedTravelers = addTravelersDto.travelers.map((traveler) => ({
            ...traveler,
            bus: traveler.bus ? new Types.ObjectId(traveler.bus) : undefined,
        }));

        travel.travelers.push(...processedTravelers);
        return await travel.save();
    }

    async updateTraveler(travelId: string, travelerId: string, travelerData: OrganizedTravelerDto): Promise<IOrganizedTravel> {
        const travel = await this.travelModel.findById(travelId);

        if (!travel) {
            throw new NotFoundException('Udhëtimi nuk u gjet');
        }

        const travelerIndex = travel.travelers.findIndex((t: any) => t._id.toString() === travelerId);

        if (travelerIndex === -1) {
            throw new NotFoundException('Udhëtari nuk u gjet');
        }

        const updatedTraveler = {
            ...travel.travelers[travelerIndex].toObject(),
            ...travelerData,
            bus: travelerData.bus
                ? new Types.ObjectId(travelerData.bus)
                : travel.travelers[travelerIndex].bus,
        };

        travel.travelers[travelerIndex] = updatedTraveler;
        return await travel.save();
    }

    async removeTraveler(travelId: string, travelerId: string): Promise<IOrganizedTravel> {
        const travel = await this.travelModel.findById(travelId);

        if (!travel) {
            throw new NotFoundException('Udhëtimi nuk u gjet');
        }

        travel.travelers = travel.travelers.filter((t: any) => t._id.toString() !== travelerId);
        return await travel.save();
    }

    async assignBus(travelId: string, assignBusDto: AssignOrganizedBusDto): Promise<IOrganizedTravel> {
        const travel = await this.travelModel.findById(travelId);

        if (!travel) {
            throw new NotFoundException('Udhëtimi nuk u gjet');
        }

        const busObjectId = new Types.ObjectId(assignBusDto.bus_id);

        if (!travel.buses.some((b: any) => b.toString() === assignBusDto.bus_id)) {
            travel.buses.push(busObjectId);
        }

        travel.travelers = travel.travelers.map((traveler: any) => {
            if (assignBusDto.traveler_ids.includes(traveler._id.toString())) {
                return { ...traveler.toObject(), bus: busObjectId };
            }
            return traveler;
        });

        return await travel.save();
    }

    async getTravelersByBus(travelId: string): Promise<any> {
        const travel = await this.findOne(travelId);
        const travelersByBus: any = {};

        travel.travelers.forEach((traveler: any) => {
            const busId = traveler.bus?._id?.toString() || 'unassigned';
            const busName = traveler.bus?.name || 'Pa autobus';

            if (!travelersByBus[busId]) {
                travelersByBus[busId] = { bus: traveler.bus || null, busName, travelers: [] };
            }
            travelersByBus[busId].travelers.push(traveler);
        });

        return Object.values(travelersByBus);
    }

    async getBorderList(travelId: string): Promise<any[]> {
        const travel = await this.findOne(travelId);
        return travel.travelers.filter((t: any) => t.show_in_border_list !== false);
    }

    async getGuideList(travelId: string): Promise<any[]> {
        const travel = await this.findOne(travelId);
        return travel.travelers.filter((t: any) => t.show_in_guide_list !== false);
    }

    async updatePrintColumns(travelId: string, printColumns: any): Promise<IOrganizedTravel> {
        const travel = await this.travelModel.findByIdAndUpdate(
            travelId,
            { $set: { print_columns: printColumns } },
            { new: true },
        );

        if (!travel) {
            throw new NotFoundException('Udhëtimi nuk u gjet');
        }

        return travel;
    }
}
