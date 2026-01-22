import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  IHotelReservation,
  ReservationStatus,
} from 'src/shared/types/hotel.types';
import {
  CreateHotelReservationDto,
  UpdateHotelReservationDto,
  AddReservationLogDto,
  HotelReservationQueryDto,
} from 'src/shared/DTO/hotel.dto';

@Injectable()
export class HotelReservationService {
  constructor(
    @InjectModel('HotelReservation')
    private reservationModel: Model<IHotelReservation>,
  ) { }

  private validateTravelerPassport(traveler: any, departureDate: Date, departureCity?: string, arrivalCity?: string) {
    const isIstanbulOrStamboll = (city?: string) =>
      city?.toLowerCase() === 'istanbul' || city?.toLowerCase() === 'stamboll';

    if (isIstanbulOrStamboll(departureCity) || isIstanbulOrStamboll(arrivalCity)) {
      if (!traveler.passport_expiry_date) {
        throw new BadRequestException(`Data e skadimit të pasaportës është e detyrueshme për destinacionin Stamboll (${traveler.full_name || ''})`);
      }

      const expiryDate = new Date(traveler.passport_expiry_date);
      const depDate = new Date(departureDate);

      const diffTime = expiryDate.getTime() - depDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 150) {
        throw new BadRequestException(`Pasaporta e udhëtarit ${traveler.full_name || ''} duhet të jetë e vlefshme edhe të paktën 150 ditë pas datës së nisjes.`);
      }
    }
  }

  async create(
    createReservationDto: CreateHotelReservationDto,
  ): Promise<IHotelReservation> {
    const reservationData = {
      ...createReservationDto,
      hotel_partner: createReservationDto.hotel_partner
        ? new Types.ObjectId(createReservationDto.hotel_partner)
        : undefined,
      agency: new Types.ObjectId(createReservationDto.agency),
      employee: createReservationDto.employee
        ? new Types.ObjectId(createReservationDto.employee)
        : undefined,
    };

    if (createReservationDto.travelers) {
      createReservationDto.travelers.forEach(traveler => {
        this.validateTravelerPassport(traveler, createReservationDto.check_in_date, createReservationDto.departure_city, createReservationDto.arrival_city);
      });
    }

    const reservation = new this.reservationModel(reservationData);
    const savedReservation = await reservation.save();

    return await this.findById(
      savedReservation._id.toString(),
      createReservationDto.agency,
    );
  }

  async findAll(query: HotelReservationQueryDto): Promise<{
    reservations: IHotelReservation[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      hotel_name,
      hotel_booking_id,
      hotel_partner,
      check_in_from,
      check_in_to,
      status,
      agency,
      page = 1,
      limit = 10,
    } = query;

    const filter: any = {
      is_deleted: { $ne: true },
      agency: new Types.ObjectId(agency),
    };

    if (hotel_name) {
      filter.hotel_name = { $regex: hotel_name, $options: 'i' };
    }

    if (hotel_booking_id) {
      filter.hotel_booking_id = { $regex: hotel_booking_id, $options: 'i' };
    }

    if (hotel_partner) {
      filter.hotel_partner = new Types.ObjectId(hotel_partner);
    }

    if (check_in_from || check_in_to) {
      filter.check_in_date = {};
      if (check_in_from) {
        filter.check_in_date.$gte = check_in_from;
      }
      if (check_in_to) {
        filter.check_in_date.$lte = check_in_to;
      }
    }

    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;

    const [reservations, total] = await Promise.all([
      this.reservationModel
        .find(filter)
        .populate('hotel_partner')
        .populate('employee', 'email')
        .populate('agency')
        .sort({ check_in_date: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.reservationModel.countDocuments(filter).exec(),
    ]);

    return {
      reservations,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, agencyId: string): Promise<IHotelReservation> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid reservation ID');
    }

    const reservation = await this.reservationModel
      .findOne({
        _id: id,
        is_deleted: { $ne: true },
        agency: new Types.ObjectId(agencyId),
      })
      .populate('hotel_partner')
      .populate('employee', 'email')
      .populate('agency')
      .populate('logs.employee', 'email')
      .exec();

    if (!reservation) {
      throw new NotFoundException('Hotel reservation not found');
    }

    return reservation;
  }

  async findByBookingId(
    bookingId: string,
    agencyId: string,
  ): Promise<IHotelReservation> {
    const reservation = await this.reservationModel
      .findOne({
        hotel_booking_id: { $regex: bookingId, $options: 'i' },
        is_deleted: { $ne: true },
        agency: new Types.ObjectId(agencyId),
      })
      .populate('hotel_partner')
      .populate('employee', 'email')
      .populate('agency')
      .exec();

    if (!reservation) {
      throw new NotFoundException('Hotel reservation not found');
    }

    return reservation;
  }

  async update(
    id: string,
    agencyId: string,
    updateReservationDto: UpdateHotelReservationDto,
  ): Promise<IHotelReservation> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid reservation ID');
    }

    const updateData: any = { ...updateReservationDto };

    if (updateReservationDto.hotel_partner) {
      updateData.hotel_partner = new Types.ObjectId(
        updateReservationDto.hotel_partner,
      );
    }

    if (updateReservationDto.travelers) {
      updateReservationDto.travelers.forEach(traveler => {
        this.validateTravelerPassport(traveler, updateReservationDto.check_in_date || new Date(), updateReservationDto.departure_city, updateReservationDto.arrival_city);
      });
    }

    const reservation = await this.reservationModel
      .findOneAndUpdate(
        {
          _id: id,
          is_deleted: { $ne: true },
          agency: new Types.ObjectId(agencyId),
        },
        { $set: updateData },
        { new: true },
      )
      .populate('hotel_partner')
      .populate('employee', 'email')
      .populate('agency')
      .exec();

    if (!reservation) {
      throw new NotFoundException('Hotel reservation not found');
    }

    return reservation;
  }

  async delete(id: string, agencyId: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid reservation ID');
    }

    const result = await this.reservationModel.findOneAndUpdate(
      {
        _id: id,
        agency: new Types.ObjectId(agencyId),
      },
      { is_deleted: true },
      { new: true },
    );

    if (!result) {
      throw new NotFoundException('Hotel reservation not found');
    }

    return { message: 'Hotel reservation deleted successfully' };
  }

  async addLog(
    id: string,
    agencyId: string,
    addLogDto: AddReservationLogDto,
  ): Promise<IHotelReservation> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid reservation ID');
    }

    const logEntry = {
      ...addLogDto,
      employee: addLogDto.employee
        ? new Types.ObjectId(addLogDto.employee)
        : undefined,
      created_at: new Date(),
    };

    const reservation = await this.reservationModel
      .findOneAndUpdate(
        {
          _id: id,
          is_deleted: { $ne: true },
          agency: new Types.ObjectId(agencyId),
        },
        { $push: { logs: logEntry } },
        { new: true },
      )
      .populate('hotel_partner')
      .populate('employee', 'email')
      .populate('agency')
      .populate('logs.employee', 'email')
      .exec();

    if (!reservation) {
      throw new NotFoundException('Hotel reservation not found');
    }

    return reservation;
  }

  async updateStatus(
    id: string,
    agencyId: string,
    status: ReservationStatus,
  ): Promise<IHotelReservation> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid reservation ID');
    }

    const reservation = await this.reservationModel
      .findOneAndUpdate(
        {
          _id: id,
          is_deleted: { $ne: true },
          agency: new Types.ObjectId(agencyId),
        },
        { $set: { status } },
        { new: true },
      )
      .populate('hotel_partner')
      .populate('employee', 'email')
      .populate('agency')
      .exec();

    if (!reservation) {
      throw new NotFoundException('Hotel reservation not found');
    }

    return reservation;
  }

  async getStatsByPartner(agencyId: string): Promise<any[]> {
    return await this.reservationModel.aggregate([
      {
        $match: {
          is_deleted: { $ne: true },
          agency: new Types.ObjectId(agencyId),
        },
      },
      {
        $group: {
          _id: '$hotel_partner',
          totalReservations: { $sum: 1 },
          totalTravelers: { $sum: { $size: '$travelers' } },
          pending: {
            $sum: {
              $cond: [{ $eq: ['$status', ReservationStatus.PENDING] }, 1, 0],
            },
          },
          confirmed: {
            $sum: {
              $cond: [{ $eq: ['$status', ReservationStatus.CONFIRMED] }, 1, 0],
            },
          },
          completed: {
            $sum: {
              $cond: [{ $eq: ['$status', ReservationStatus.COMPLETED] }, 1, 0],
            },
          },
          cancelled: {
            $sum: {
              $cond: [{ $eq: ['$status', ReservationStatus.CANCELLED] }, 1, 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'partnerhotels',
          localField: '_id',
          foreignField: '_id',
          as: 'partner',
        },
      },
      { $unwind: { path: '$partner', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          partnerName: '$partner.name',
          totalReservations: 1,
          totalTravelers: 1,
          pending: 1,
          confirmed: 1,
          completed: 1,
          cancelled: 1,
        },
      },
      { $sort: { totalReservations: -1 } },
    ]);
  }
}
