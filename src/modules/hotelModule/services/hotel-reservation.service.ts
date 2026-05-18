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
import { TransactionServiceService } from 'src/transactions/transaction-service.service';
import {
  TransactionTypes,
  TransactionStatus,
} from 'src/shared/types/transaction.types';
import { PaymentStatusTypes } from 'src/shared/types/payment.types';

@Injectable()
export class HotelReservationService {
  constructor(
    @InjectModel('HotelReservation')
    private reservationModel: Model<IHotelReservation>,
    private transactionService: TransactionServiceService,
  ) {}
  private validateTravelerPassport(
    traveler: any,
    departureDate: Date,
    departureCity?: string,
    arrivalCity?: string,
  ) {
    const isIstanbulOrStamboll = (city?: string) =>
      city?.toLowerCase() === 'istanbul' || city?.toLowerCase() === 'stamboll';

    if (
      isIstanbulOrStamboll(departureCity) ||
      isIstanbulOrStamboll(arrivalCity)
    ) {
      if (traveler.passport_expiry_date) {
        const expiryDate = new Date(traveler.passport_expiry_date);
        const depDate = new Date(departureDate);

        const diffTime = expiryDate.getTime() - depDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 150) {
          throw new BadRequestException(
            `Pasaporta e udhëtarit ${traveler.full_name || ''} duhet të jetë e vlefshme edhe të paktën 150 ditë pas datës së nisjes.`,
          );
        }
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
      operator: createReservationDto.operator
        ? new Types.ObjectId(createReservationDto.operator)
        : undefined,
    };
    if (createReservationDto.travelers) {
      createReservationDto.travelers.forEach((traveler: any) => {
        this.validateTravelerPassport(
          traveler,
          createReservationDto.check_in_date,
          createReservationDto.departure_city,
          createReservationDto.arrival_city,
        );
      });
    }

    const reservation = new this.reservationModel(reservationData);
    const savedReservation = await reservation.save();

    const employeeId = createReservationDto.employee || '';
    const agencyId = createReservationDto.agency || '';

    try {
      const priceValue =
        typeof createReservationDto.price === 'string'
          ? parseFloat(createReservationDto.price)
          : createReservationDto.price;
      console.log('[HOTEL-TX] === START ===');
      console.log(
        '[HOTEL-TX] Price:',
        priceValue,
        'Currency:',
        createReservationDto.currency,
      );
      console.log('[HOTEL-TX] ReservationId:', savedReservation._id.toString());
      console.log('[HOTEL-TX] AgencyId:', agencyId, 'EmployeeId:', employeeId);

      const debtTx = await this.transactionService.create({
        amount: priceValue as number,
        currency: createReservationDto.currency as any,
        type: TransactionTypes.DEBT,
        status: TransactionStatus.PENDING,
        hotelReservation: savedReservation._id.toString(),
        agency: agencyId,
        user: employeeId,
        description: `Borxh - Rezervim hoteli e papaguar (${savedReservation.hotel_booking_id})`,
      });
      console.log(
        '[HOTEL-TX] DEBT created:',
        debtTx?._id?.toString(),
        'type:',
        debtTx?.type,
        'status:',
        debtTx?.status,
        'amount:',
        debtTx?.amount,
      );

      const paymentChunks = createReservationDto.payment_chunks || [];
      let totalPaidInReservationCurrency = 0;
      const reservationCurrency = createReservationDto.currency || 'euro';
      console.log('[HOTEL-TX] Chunks count:', paymentChunks.length);

      for (const chunk of paymentChunks) {
        console.log(
          '[HOTEL-TX] Processing chunk:',
          chunk.amount,
          chunk.currency,
        );

        const incomeTx = await this.transactionService.create({
          amount: chunk.amount,
          currency: chunk.currency as any,
          type: TransactionTypes.INCOME,
          status: TransactionStatus.SETTLED,
          hotelReservation: savedReservation._id.toString(),
          agency: agencyId,
          user: employeeId,
          description: `Pagesë - Rezervim hoteli (${savedReservation.hotel_booking_id})`,
        });
        console.log(
          '[HOTEL-TX] INCOME created:',
          incomeTx?._id?.toString(),
          'type:',
          incomeTx?.type,
        );

        const reducedTx =
          await this.transactionService.reduceDebtByHotelReservation(
            savedReservation._id.toString(),
            chunk.amount,
            chunk.currency,
            agencyId,
            employeeId,
          );
        console.log(
          '[HOTEL-TX] After reduceDebt:',
          reducedTx
            ? `id=${reducedTx._id} type=${reducedTx.type} status=${(reducedTx as any).status} amount=${reducedTx.amount}`
            : 'NULL (debt not found!)',
        );

        const converted = await this.transactionService.convertCurrency(
          chunk.amount,
          chunk.currency,
          reservationCurrency,
        );
        totalPaidInReservationCurrency += converted;
        console.log(
          '[HOTEL-TX] Converted:',
          chunk.amount,
          chunk.currency,
          '->',
          converted,
          reservationCurrency,
          'totalPaid:',
          totalPaidInReservationCurrency,
        );
      }

      const remainingDebt =
        Math.round(((priceValue || 0) - totalPaidInReservationCurrency) * 100) /
        100;
      const hasAnyPayments = paymentChunks.length > 0;
      let newPaymentStatus = PaymentStatusTypes.UNPAID;

      if (remainingDebt <= 0 && hasAnyPayments) {
        newPaymentStatus = PaymentStatusTypes.PAID;
      } else if (remainingDebt > 0 && hasAnyPayments) {
        newPaymentStatus = PaymentStatusTypes.PARTIALLY_PAID;
      }
      console.log(
        '[HOTEL-TX] RemainingDebt:',
        remainingDebt,
        'PaymentStatus:',
        newPaymentStatus,
      );

      if (newPaymentStatus !== savedReservation.payment_status) {
        await this.reservationModel.updateOne(
          { _id: savedReservation._id },
          { $set: { payment_status: newPaymentStatus } },
        );
      }
      console.log('[HOTEL-TX] === END ===');
    } catch (error) {
      console.error('[HOTEL-TX] FAILED:', error);
    }

    // Call findById WITHOUT agencyId filter to avoid 404 if agency string is slightly different
    return await this.findById(savedReservation._id.toString());
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
        .populate('operator')
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

  async findById(id: string, agencyId?: string): Promise<IHotelReservation> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid reservation ID');
    }

    const filter: any = {
      _id: id,
      is_deleted: { $ne: true },
    };

    if (agencyId && Types.ObjectId.isValid(agencyId)) {
      filter.agency = new Types.ObjectId(agencyId);
    }

    const reservation = await this.reservationModel
      .findOne(filter)
      .populate('hotel_partner')
      .populate('employee', 'email')
      .populate('agency')
      .populate('operator')
      .populate('logs.employee', 'email')
      .exec();

    if (!reservation) {
      throw new NotFoundException('Hotel reservation not found');
    }

    return reservation;
  }

  async findByBookingId(
    bookingId: string,
    agencyId?: string,
  ): Promise<IHotelReservation> {
    const filter: any = {
      hotel_booking_id: { $regex: bookingId, $options: 'i' },
      is_deleted: { $ne: true },
    };

    if (agencyId && Types.ObjectId.isValid(agencyId)) {
      filter.agency = new Types.ObjectId(agencyId);
    }

    const reservation = await this.reservationModel
      .findOne(filter)
      .populate('hotel_partner')
      .populate('employee', 'email')
      .populate('agency')
      .populate('operator')
      .exec();

    if (!reservation) {
      throw new NotFoundException('Hotel reservation not found');
    }

    return reservation;
  }

  async update(
    id: string,
    agencyId: string | undefined,
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
    } else if (
      updateReservationDto.hotel_partner === null ||
      updateReservationDto.hotel_partner === undefined
    ) {
      updateData.hotel_partner = null;
    }
    if (updateReservationDto.operator) {
      updateData.operator = new Types.ObjectId(updateReservationDto.operator);
    }
    if (updateReservationDto.travelers) {
      updateReservationDto.travelers.forEach((traveler: any) => {
        this.validateTravelerPassport(
          traveler,
          updateReservationDto.check_in_date || new Date(),
          updateReservationDto.departure_city,
          updateReservationDto.arrival_city,
        );
      });
    }

    const filter: any = {
      _id: id,
      is_deleted: { $ne: true },
    };

    if (agencyId && Types.ObjectId.isValid(agencyId)) {
      filter.agency = new Types.ObjectId(agencyId);
    }

    const currentReservation = await this.reservationModel.findById(id).exec();
    if (!currentReservation) {
      throw new NotFoundException('Hotel reservation not found');
    }

    const oldPrice = currentReservation.price || 0;
    const updatePrice =
      typeof updateReservationDto.price === 'string'
        ? parseFloat(updateReservationDto.price)
        : updateReservationDto.price;
    const newPrice = updatePrice !== undefined ? updatePrice : oldPrice;
    const priceChanged = updatePrice !== undefined && oldPrice !== newPrice;

    const reservation = await this.reservationModel
      .findOneAndUpdate(filter, { $set: updateData }, { new: true })
      .populate('hotel_partner')
      .populate('employee', 'email')
      .populate('agency')
      .populate('operator')
      .exec();

    if (!reservation) {
      throw new NotFoundException('Hotel reservation not found');
    }

    const employeeId =
      updateReservationDto.employee ||
      currentReservation.employee?.toString() ||
      '';
    const currentAgencyId =
      agencyId || currentReservation.agency?.toString() || '';
    const currency =
      updateReservationDto.currency || currentReservation.currency || 'euro';

    // Handle Transaction updates
    if (priceChanged || updateReservationDto.payment_chunks) {
      const oldChunks = currentReservation.payment_chunks || [];
      const newChunks = reservation.payment_chunks || [];
      const newlyAddedChunks = newChunks.slice(oldChunks.length);

      // 1. Create income transactions for newly added chunks
      for (const chunk of newlyAddedChunks) {
        if (chunk.amount > 0) {
          await this.transactionService.create({
            amount: chunk.amount,
            currency: chunk.currency,
            type: TransactionTypes.INCOME,
            status: TransactionStatus.SETTLED,
            hotelReservation: id,
            agency: currentAgencyId,
            user: employeeId,
            description: `Pagesë - Rezervim hoteli (${reservation.hotel_booking_id})`,
          });
        }
      }

      // 2. Recalculate total debt
      let totalPaidInReservationCurrency = 0;
      for (const chunk of newChunks) {
        if (chunk.amount <= 0) continue;
        totalPaidInReservationCurrency +=
          await this.transactionService.convertCurrency(
            chunk.amount,
            chunk.currency,
            currency,
          );
      }

      const remainingDebt =
        Math.round(((newPrice ?? 0) - totalPaidInReservationCurrency) * 100) /
        100;

      // Update or create debt transaction
      const existingDebtTx =
        await this.transactionService.findDebtByHotelReservation(id);

      if (existingDebtTx) {
        if (remainingDebt > 0) {
          existingDebtTx.amount = remainingDebt;
          if (currentAgencyId)
            existingDebtTx.agency = new Types.ObjectId(currentAgencyId);
          if (employeeId) existingDebtTx.user = new Types.ObjectId(employeeId);
          await existingDebtTx.save();
        } else {
          await existingDebtTx.deleteOne();
        }
      } else if (remainingDebt > 0) {
        await this.transactionService.create({
          amount: remainingDebt,
          currency: currency as any,
          type: TransactionTypes.DEBT,
          status: TransactionStatus.PENDING,
          hotelReservation: id,
          agency: currentAgencyId,
          user: employeeId,
          description: `Borxh - Rezervim hoteli e papaguar (${reservation.hotel_booking_id})`,
        });
      }

      // Update payment status based on remaining debt
      const hasAnyPayments = newChunks.length > 0;
      let newPaymentStatus = PaymentStatusTypes.UNPAID;
      if (remainingDebt <= 0 && hasAnyPayments) {
        newPaymentStatus = PaymentStatusTypes.PAID;
      } else if (remainingDebt > 0 && hasAnyPayments) {
        newPaymentStatus = PaymentStatusTypes.PARTIALLY_PAID;
      }

      if (newPaymentStatus !== reservation.payment_status) {
        await this.reservationModel.updateOne(
          { _id: id },
          { $set: { payment_status: newPaymentStatus } },
        );
        reservation.payment_status = newPaymentStatus;
      }
    }

    return reservation;
  }

  async delete(id: string, agencyId?: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid reservation ID');
    }

    const filter: any = { _id: id };
    if (agencyId && Types.ObjectId.isValid(agencyId)) {
      filter.agency = new Types.ObjectId(agencyId);
    }

    const result = await this.reservationModel.findOneAndUpdate(
      filter,
      { is_deleted: true },
      { new: true },
    );

    if (!result) {
      throw new NotFoundException('Hotel reservation not found');
    }

    // Delete associated transactions
    try {
      await this.transactionService.deleteByHotelReservation(id);
    } catch (error) {
      console.error(
        'Failed to delete transactions for reservation:',
        id,
        error,
      );
    }

    return { message: 'Hotel reservation deleted successfully' };
  }

  async addLog(
    id: string,
    agencyId: string | undefined,
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

    const filter: any = {
      _id: id,
      is_deleted: { $ne: true },
    };

    if (agencyId && Types.ObjectId.isValid(agencyId)) {
      filter.agency = new Types.ObjectId(agencyId);
    }

    const reservation = await this.reservationModel
      .findOneAndUpdate(filter, { $push: { logs: logEntry } }, { new: true })
      .populate('hotel_partner')
      .populate('employee', 'email')
      .populate('agency')
      .populate('operator')
      .populate('logs.employee', 'email')
      .exec();

    if (!reservation) {
      throw new NotFoundException('Hotel reservation not found');
    }

    return reservation;
  }

  async updateStatus(
    id: string,
    agencyId: string | undefined,
    status: ReservationStatus,
  ): Promise<IHotelReservation> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid reservation ID');
    }

    const filter: any = {
      _id: id,
      is_deleted: { $ne: true },
    };

    if (agencyId && Types.ObjectId.isValid(agencyId)) {
      filter.agency = new Types.ObjectId(agencyId);
    }

    const reservation = await this.reservationModel
      .findOneAndUpdate(filter, { $set: { status } }, { new: true })
      .populate('hotel_partner')
      .populate('employee', 'email')
      .populate('agency')
      .populate('operator')
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
