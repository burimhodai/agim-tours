import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
    CreateEventDto,
    UpdateEventDto,
    EventQueryDto,
    EventTravelerDto,
    AddTravelerDto,
    AssignBusDto,
} from 'src/shared/DTO/eventHotel.dto';

export interface IEventHotel {
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
    room_groups: any[];
    buses: Types.ObjectId[];
    hotel?: Types.ObjectId;
    print_columns?: any;
    employee?: Types.ObjectId;
    agency?: Types.ObjectId;
    logs?: any[];
    is_deleted?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

@Injectable()
export class EventHotelService {
    constructor(
        @InjectModel('EventHotel') private eventModel: Model<IEventHotel>,
    ) { }

    private generateEventUid(): string {
        const numDigits = Math.random() < 0.5 ? 5 : 6;
        const min = Math.pow(10, numDigits - 1);
        const max = Math.pow(10, numDigits) - 1;
        const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
        return `E${randomNum}`;
    }

    async create(createEventDto: CreateEventDto): Promise<IEventHotel> {
        const eventData = {
            ...createEventDto,
            uid: this.generateEventUid(),
            agency: createEventDto.agency
                ? new Types.ObjectId(createEventDto.agency)
                : undefined,
            hotel: createEventDto.hotel
                ? new Types.ObjectId(createEventDto.hotel)
                : undefined,
            employee: createEventDto.employee
                ? new Types.ObjectId(createEventDto.employee)
                : undefined,
            buses: createEventDto.buses?.map((id) => new Types.ObjectId(id)) || [],
        };

        const newEvent = new this.eventModel(eventData);
        return await newEvent.save();
    }

    async findAll(query: EventQueryDto): Promise<{
        events: IEventHotel[];
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
        const total = await this.eventModel.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);

        const events = await this.eventModel
            .find(filter)
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit)
            .populate('agency')
            .populate('employee')
            .populate('hotel')
            .populate('buses')
            .populate('travelers.room_type')
            .populate('travelers.hotel')
            .populate('travelers.bus')
            .populate('room_groups.room_type')
            .populate('room_groups.hotel')
            .exec();

        return { events, total, page, totalPages };
    }

    async findOne(id: string): Promise<IEventHotel> {
        const event = await this.eventModel
            .findById(id)
            .populate('agency')
            .populate('employee')
            .populate('hotel')
            .populate('buses')
            .populate('travelers.room_type')
            .populate('travelers.hotel')
            .populate('travelers.bus')
            .populate('room_groups.room_type')
            .populate('room_groups.hotel')
            .exec();

        if (!event || event.is_deleted) {
            throw new NotFoundException('Ngjarja nuk u gjet');
        }

        return event;
    }

    async update(id: string, updateEventDto: UpdateEventDto): Promise<IEventHotel> {
        const updateData: any = { ...updateEventDto };

        if (updateEventDto.buses) {
            updateData.buses = updateEventDto.buses.map((busId) => new Types.ObjectId(busId));
        }

        const event = await this.eventModel
            .findByIdAndUpdate(id, { $set: updateData }, { new: true })
            .populate('agency')
            .populate('employee')
            .populate('hotel')
            .populate('buses')
            .populate('travelers.room_type')
            .populate('travelers.hotel')
            .populate('travelers.bus')
            .populate('room_groups.room_type')
            .populate('room_groups.hotel')
            .exec();

        if (!event) {
            throw new NotFoundException('Ngjarja nuk u gjet');
        }

        return event;
    }

    async delete(id: string): Promise<{ message: string }> {
        const event = await this.eventModel.findByIdAndUpdate(
            id,
            { $set: { is_deleted: true } },
            { new: true },
        );

        if (!event) {
            throw new NotFoundException('Ngjarja nuk u gjet');
        }

        return { message: 'Ngjarja u fshi me sukses' };
    }

    async addTravelers(id: string, addTravelerDto: AddTravelerDto): Promise<IEventHotel> {
        const event = await this.eventModel.findById(id);

        if (!event) {
            throw new NotFoundException('Ngjarja nuk u gjet');
        }

        const processedTravelers = addTravelerDto.travelers.map((traveler) => ({
            ...traveler,
            room_type: traveler.room_type ? new Types.ObjectId(traveler.room_type) : undefined,
            hotel: traveler.hotel ? new Types.ObjectId(traveler.hotel) : undefined,
            bus: traveler.bus ? new Types.ObjectId(traveler.bus) : undefined,
        }));

        event.travelers.push(...processedTravelers);
        return await event.save();
    }

    async updateTraveler(eventId: string, travelerId: string, travelerData: EventTravelerDto): Promise<IEventHotel> {
        const event = await this.eventModel.findById(eventId);

        if (!event) {
            throw new NotFoundException('Ngjarja nuk u gjet');
        }

        const travelerIndex = event.travelers.findIndex((t: any) => t._id.toString() === travelerId);

        if (travelerIndex === -1) {
            throw new NotFoundException('Udhëtari nuk u gjet');
        }

        const updatedTraveler = {
            ...event.travelers[travelerIndex].toObject(),
            ...travelerData,
            room_type: travelerData.room_type
                ? new Types.ObjectId(travelerData.room_type)
                : event.travelers[travelerIndex].room_type,
            hotel: travelerData.hotel
                ? new Types.ObjectId(travelerData.hotel)
                : event.travelers[travelerIndex].hotel,
            bus: travelerData.bus
                ? new Types.ObjectId(travelerData.bus)
                : event.travelers[travelerIndex].bus,
        };

        event.travelers[travelerIndex] = updatedTraveler;
        return await event.save();
    }

    async removeTraveler(eventId: string, travelerId: string): Promise<IEventHotel> {
        const event = await this.eventModel.findById(eventId);

        if (!event) {
            throw new NotFoundException('Ngjarja nuk u gjet');
        }

        event.travelers = event.travelers.filter((t: any) => t._id.toString() !== travelerId);
        return await event.save();
    }

    async assignBus(eventId: string, assignBusDto: AssignBusDto): Promise<IEventHotel> {
        const event = await this.eventModel.findById(eventId);

        if (!event) {
            throw new NotFoundException('Ngjarja nuk u gjet');
        }

        const busObjectId = new Types.ObjectId(assignBusDto.bus_id);

        if (!event.buses.some((b: any) => b.toString() === assignBusDto.bus_id)) {
            event.buses.push(busObjectId);
        }

        event.travelers = event.travelers.map((traveler: any) => {
            if (assignBusDto.traveler_ids.includes(traveler._id.toString())) {
                return { ...traveler.toObject(), bus: busObjectId };
            }
            return traveler;
        });

        return await event.save();
    }

    async getTravelersByBus(eventId: string): Promise<any> {
        const event = await this.findOne(eventId);
        const travelersByBus: any = {};

        event.travelers.forEach((traveler: any) => {
            const busId = traveler.bus?._id?.toString() || 'unassigned';
            const busName = traveler.bus?.name || 'Pa autobus';

            if (!travelersByBus[busId]) {
                travelersByBus[busId] = { bus: traveler.bus || null, busName, travelers: [] };
            }
            travelersByBus[busId].travelers.push(traveler);
        });

        return Object.values(travelersByBus);
    }

    async getTravelersByHotel(eventId: string): Promise<any> {
        const event = await this.findOne(eventId);
        const travelersByHotel: any = {};

        event.travelers.forEach((traveler: any) => {
            const hotelId = traveler.hotel?._id?.toString() || 'unassigned';
            const hotelName = traveler.hotel?.name || 'Pa hotel';

            if (!travelersByHotel[hotelId]) {
                travelersByHotel[hotelId] = { hotel: traveler.hotel || null, hotelName, travelers: [] };
            }
            travelersByHotel[hotelId].travelers.push(traveler);
        });

        return Object.values(travelersByHotel);
    }

    async getHotelList(eventId: string): Promise<any[]> {
        const event = await this.findOne(eventId);
        return event.travelers.filter((t: any) => t.show_in_hotel_list !== false);
    }

    async getBorderList(eventId: string): Promise<any[]> {
        const event = await this.findOne(eventId);
        return event.travelers.filter((t: any) => t.show_in_border_list !== false);
    }

    async getGuideList(eventId: string): Promise<any[]> {
        const event = await this.findOne(eventId);
        return event.travelers.filter((t: any) => t.show_in_guide_list !== false);
    }

    async updatePrintColumns(eventId: string, printColumns: any): Promise<IEventHotel> {
        const event = await this.eventModel.findByIdAndUpdate(
            eventId,
            { $set: { print_columns: printColumns } },
            { new: true },
        );

        if (!event) {
            throw new NotFoundException('Ngjarja nuk u gjet');
        }

        return event;
    }
}
