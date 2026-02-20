import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CreateEventDto,
  UpdateEventDto,
  EventQueryDto,
  EventTravelerDto,
  AddTravelerDto,
  AssignBusDto,
  RefundTravelerDto,
} from 'src/shared/DTO/eventHotel.dto';
import { PaymentStatusTypes } from 'src/shared/types/payment.types';
import {
  TransactionTypes,
  TransactionStatus,
} from 'src/shared/types/transaction.types';
import { TransactionServiceService } from 'src/transactions/transaction-service.service';

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
  departure_city?: string;
  arrival_city?: string;
  travelers: any[];
  room_groups?: any[];
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
    private transactionService: TransactionServiceService,
  ) { }

  private validateTravelerPassport(traveler: any, departureDate: Date, departureCity?: string, arrivalCity?: string, location?: string) {
    const isIstanbulOrStamboll = (city?: string) =>
      city?.toLowerCase() === 'istanbul' || city?.toLowerCase() === 'stamboll';

    if (isIstanbulOrStamboll(location)) {
      if (!traveler.passport_expiry_date) {
        throw new BadRequestException(`Data e skadimit të pasaportës është e detyrueshme për destinacionin Stamboll (${traveler.first_name || ''} ${traveler.last_name || ''})`);
      }

      const expiryDate = new Date(traveler.passport_expiry_date);
      const depDate = new Date(departureDate);

      const diffTime = expiryDate.getTime() - depDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 150) {
        throw new BadRequestException(`Pasaporta e udhëtarit ${traveler.first_name || ''} ${traveler.last_name || ''} duhet të jetë e vlefshme edhe të paktën 150 ditë pas datës së nisjes.`);
      }
    }
  }

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
      documentId: createEventDto.documentId
        ? new Types.ObjectId(createEventDto.documentId)
        : undefined,
      documentMkId: createEventDto.documentMkId
        ? new Types.ObjectId(createEventDto.documentMkId)
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

    const filter: any = {};

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
      .populate('documentId')
      .populate('documentMkId')
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
      .populate('documentId')
      .populate('documentMkId')
      .exec();

    if (!event) {
      throw new NotFoundException('Ngjarja nuk u gjet');
    }

    return event;
  }

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
  ): Promise<IEventHotel> {
    console.log({ updateEventDto });

    const updateData: any = { ...updateEventDto };

    if (updateEventDto.buses) {
      updateData.buses = updateEventDto.buses
        .filter((busId) => busId && busId !== '')
        .map((busId) => new Types.ObjectId(busId));
    }

    if (updateEventDto.agency && updateEventDto.agency !== '') {
      updateData.agency = new Types.ObjectId(updateEventDto.agency);
    } else if (updateEventDto.agency === '') {
      updateData.agency = undefined;
    }

    if (updateEventDto.hotel && updateEventDto.hotel !== '') {
      updateData.hotel = new Types.ObjectId(updateEventDto.hotel);
    } else if (updateEventDto.hotel === '') {
      updateData.hotel = undefined;
    }

    if (updateEventDto.employee && updateEventDto.employee !== '') {
      updateData.employee = new Types.ObjectId(updateEventDto.employee);
    } else if (updateEventDto.employee === '') {
      updateData.employee = undefined;
    }

    if (updateEventDto.documentId && updateEventDto.documentId !== '') {
      updateData.documentId = new Types.ObjectId(updateEventDto.documentId);
    } else if (updateEventDto.documentId === '') {
      updateData.documentId = undefined;
    }

    if (updateEventDto.documentMkId && updateEventDto.documentMkId !== '') {
      updateData.documentMkId = new Types.ObjectId(updateEventDto.documentMkId);
    } else if (updateEventDto.documentMkId === '') {
      updateData.documentMkId = undefined;
    }

    if (updateEventDto?.room_groups) {
      console.log('room_groups before processing:', JSON.stringify(updateEventDto.room_groups, null, 2));

      updateData.room_groups = updateEventDto.room_groups.map((group) => {
        // Extract ID from populated object or use string directly
        const roomTypeId = typeof group.room_type === 'object' && group.room_type !== null
          ? (group.room_type as any)._id
          : group.room_type;
        const hotelId = typeof group.hotel === 'object' && group.hotel !== null
          ? (group.hotel as any)._id
          : group.hotel;

        // Build the result object without empty string fields
        const result: any = {
          group_id: group.group_id,
          room_number: group.room_number,
        };

        // Only include _id if it's a valid non-empty string
        if (group._id && group._id !== '') {
          result._id = group._id;
        }

        // Only include room_type if it's a valid ObjectId
        if (roomTypeId && roomTypeId !== '' && Types.ObjectId.isValid(roomTypeId)) {
          result.room_type = new Types.ObjectId(roomTypeId);
        }

        // Only include hotel if it's a valid ObjectId
        if (hotelId && hotelId !== '' && Types.ObjectId.isValid(hotelId)) {
          result.hotel = new Types.ObjectId(hotelId);
        }

        console.log('Processed room group:', result);
        return result;
      });
    }

    if (updateEventDto.travelers) {
      updateData.travelers = updateEventDto.travelers.map((traveler) => {
        const result: any = { ...traveler };

        if (traveler.hotel && traveler.hotel !== '') {
          const hotelId = typeof traveler.hotel === 'object' ? (traveler.hotel as any)._id : traveler.hotel;
          result.hotel = hotelId && Types.ObjectId.isValid(hotelId) ? new Types.ObjectId(hotelId) : undefined;
        } else if (traveler.hotel === '') {
          result.hotel = undefined;
        }

        if (traveler.room_type && traveler.room_type !== '') {
          const roomTypeId = typeof traveler.room_type === 'object' ? (traveler.room_type as any)._id : traveler.room_type;
          result.room_type = roomTypeId && Types.ObjectId.isValid(roomTypeId) ? new Types.ObjectId(roomTypeId) : undefined;
        } else if (traveler.room_type === '') {
          result.room_type = undefined;
        }

        if (traveler.bus && traveler.bus !== '') {
          const busId = typeof traveler.bus === 'object' ? (traveler.bus as any)._id : traveler.bus;
          result.bus = busId && Types.ObjectId.isValid(busId) ? new Types.ObjectId(busId) : undefined;
        } else if (traveler.bus === '') {
          result.bus = undefined;
        }

        return result;
      });
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
      .populate('documentId')
      .populate('documentMkId')
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

    // await this.transactionService.deleteByEvent(id);

    return { message: 'Ngjarja u çaktivizua me sukses' };
  }

  async reactivate(id: string): Promise<IEventHotel> {
    const event = await this.eventModel.findByIdAndUpdate(
      id,
      { $set: { is_deleted: false } },
      { new: true },
    );

    if (!event) {
      throw new NotFoundException('Ngjarja nuk u gjet');
    }

    return event;
  }

  async addTravelers(
    id: string,
    addTravelerDto: AddTravelerDto,
    performingAgencyId?: string,
  ): Promise<IEventHotel> {
    const event = await this.eventModel.findById(id);

    if (!event) {
      throw new NotFoundException('Ngjarja nuk u gjet');
    }

    const batchGroupId = `G-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const processedTravelers = addTravelerDto.travelers.map((traveler) => {
      this.validateTravelerPassport(traveler, event.date, event.departure_city, event.arrival_city, event.location);
      return {
        ...traveler,
        room_group_id: traveler.room_group_id || batchGroupId,
        room_type: traveler.room_type
          ? new Types.ObjectId(traveler.room_type)
          : undefined,
        hotel: traveler.hotel ? new Types.ObjectId(traveler.hotel) : undefined,
        bus: traveler.bus ? new Types.ObjectId(traveler.bus) : undefined,
      };
    });

    event.travelers.push(...processedTravelers);
    const savedEvent = await event.save();

    // Add log
    const travelerNames = processedTravelers.map(t => `${t.first_name} ${t.last_name}`).join(', ');
    await this.addLog(
      id,
      'Udhëtarët u shtuan',
      `U shtuan udhëtarët: ${travelerNames}`,
      addTravelerDto.employee
    );

    // Create transactions for each traveler with a price
    for (const traveler of savedEvent.travelers.slice(
      -processedTravelers.length,
    )) {
      if (traveler.price && traveler.price > 0) {
        await this.createTravelerTransaction(
          savedEvent._id.toString(),
          traveler._id.toString(),
          traveler,
          performingAgencyId || savedEvent.agency?.toString(),
          savedEvent.name,
        );
      }
    }

    return savedEvent;
  }

  private async createTravelerTransaction(
    eventId: string,
    travelerId: string,
    traveler: any,
    agencyId?: string,
    eventName?: string,
  ): Promise<void> {
    const isUnpaid = traveler.payment_status === PaymentStatusTypes.UNPAID;
    const isPartiallyPaid =
      traveler.payment_status === PaymentStatusTypes.PARTIALLY_PAID;
    const isPaid = traveler.payment_status === PaymentStatusTypes.PAID;

    const travelerName =
      `${traveler.first_name || ''} ${traveler.last_name || ''}`.trim();

    if (isPaid) {
      // Fully paid - create income transaction
      await this.transactionService.create({
        amount: traveler.price,
        currency: traveler.currency,
        type: TransactionTypes.INCOME,
        status: TransactionStatus.SETTLED,
        event: eventId,
        travelerId: travelerId,
        agency: agencyId,
        description: `Ngjarje: ${eventName} - Udhëtar: ${travelerName}`,
      });
    } else if (isPartiallyPaid && traveler.paid_amount > 0) {
      // Partially paid - create income for paid amount and debt for remaining
      await this.transactionService.create({
        amount: traveler.paid_amount,
        currency: traveler.currency,
        type: TransactionTypes.INCOME,
        status: TransactionStatus.SETTLED,
        event: eventId,
        travelerId: travelerId,
        agency: agencyId,
        description: `Ngjarje: ${eventName} - Udhëtar: ${travelerName} (Pagesa e pjesshme)`,
      });

      const remainingAmount = traveler.price - traveler.paid_amount;
      if (remainingAmount > 0) {
        await this.transactionService.create({
          amount: remainingAmount,
          currency: traveler.currency,
          type: TransactionTypes.DEBT,
          status: TransactionStatus.PENDING,
          event: eventId,
          travelerId: `${travelerId}_debt`,
          agency: agencyId,
          description: `Borxh - Ngjarje: ${eventName} - Udhëtar: ${travelerName}`,
        });
      }
    } else if (isUnpaid) {
      // Unpaid - create debt transaction
      await this.transactionService.create({
        amount: traveler.price,
        currency: traveler.currency,
        type: TransactionTypes.DEBT,
        status: TransactionStatus.PENDING,
        event: eventId,
        travelerId: travelerId,
        agency: agencyId,
        description: `Borxh - Ngjarje: ${eventName} - Udhëtar: ${travelerName}`,
      });
    }
  }

  async updateTravelersGroup(
    eventId: string,
    roomGroupId: string,
    travelersData: EventTravelerDto[],
    performingAgencyId?: string,
    employeeId?: string,
  ): Promise<IEventHotel> {
    const event = await this.eventModel.findById(eventId);
    if (!event) throw new NotFoundException("Ngjarja nuk u gjet");

    const otherTravelers = event.travelers.filter(
      (t: any) => t.room_group_id !== roomGroupId
    );
    const existingGroupTravelers = event.travelers.filter(
      (t: any) => t.room_group_id === roomGroupId
    );
    const processedTravelers = [];

    for (const data of travelersData) {
      this.validateTravelerPassport(data, event.date, event.departure_city, event.arrival_city);
      const existing = existingGroupTravelers.find(
        (t: any) => t._id?.toString() === data._id
      );

      const travelerData: any = {
        ...(existing?.toObject() || {}),
        ...data,
        room_group_id: roomGroupId,
        room_type:
          data.room_type && data.room_type !== ""
            ? new Types.ObjectId(data.room_type)
            : existing?.room_type,
        hotel:
          data.hotel && data.hotel !== ""
            ? new Types.ObjectId(data.hotel)
            : existing?.hotel,
        bus:
          data.bus && data.bus !== ""
            ? new Types.ObjectId(data.bus)
            : existing?.bus,
      };

      processedTravelers.push(travelerData);
    }

    event.travelers = [...otherTravelers, ...processedTravelers];
    const savedEvent = await event.save();

    // Add log
    const travelerNames = processedTravelers.map(t => `${t.first_name} ${t.last_name}`).join(', ');
    await this.addLog(
      eventId,
      'Grupi u përditësua',
      `U përditësuan të dhënat për grupin e udhëtarëve: ${travelerNames}`,
      employeeId
    );

    for (const newTraveler of processedTravelers) {
      const oldTraveler = existingGroupTravelers.find(
        (t: any) => t._id?.toString() === newTraveler._id?.toString()
      );

      if (
        oldTraveler &&
        newTraveler.payment_status &&
        newTraveler.payment_status !== oldTraveler.payment_status
      ) {
        await this.handlePaymentStatusChange(
          eventId,
          newTraveler._id.toString(),
          oldTraveler.toObject(),
          newTraveler,
          performingAgencyId || event.agency?.toString(),
          event.name
        );
      } else if (!oldTraveler && newTraveler.price > 0) {
        const createdTraveler = savedEvent.travelers.find(
          (t: any) =>
            t.first_name === newTraveler.first_name &&
            t.last_name === newTraveler.last_name &&
            t.room_group_id === roomGroupId
        );
        if (createdTraveler) {
          await this.createTravelerTransaction(
            eventId,
            createdTraveler._id.toString(),
            createdTraveler,
            performingAgencyId || event.agency?.toString(),
            event.name
          );
        }
      }
    }

    return savedEvent;
  }

  async updateTraveler(
    eventId: string,
    travelerId: string,
    travelerData: EventTravelerDto,
    performingAgencyId?: string,
    employeeId?: string,
  ): Promise<IEventHotel> {
    const event = await this.eventModel.findById(eventId);

    if (!event) {
      throw new NotFoundException('Ngjarja nuk u gjet');
    }

    const travelerIndex = event.travelers.findIndex(
      (t: any) => t._id.toString() === travelerId,
    );

    if (travelerIndex === -1) {
      throw new NotFoundException('Udhëtari nuk u gjet');
    }

    this.validateTravelerPassport(travelerData, event.date, event.departure_city, event.arrival_city);

    const oldTraveler = event.travelers[travelerIndex].toObject();
    const updatedTraveler = {
      ...oldTraveler,
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
    const savedEvent = await event.save();

    // Add log
    await this.addLog(
      eventId,
      'Udhëtari u përditësua',
      `U përditësuan të dhënat për udhëtarin: ${travelerData.first_name} ${travelerData.last_name}`,
      employeeId || travelerData.employee
    );

    // Handle payment status change
    if (
      travelerData.payment_status &&
      travelerData.payment_status !== oldTraveler.payment_status
    ) {
      await this.handlePaymentStatusChange(
        eventId,
        travelerId,
        oldTraveler,
        updatedTraveler,
        performingAgencyId || event.agency?.toString(),
        event.name,
      );
    }

    return savedEvent;
  }

  private async handlePaymentStatusChange(
    eventId: string,
    travelerId: string,
    oldTraveler: any,
    newTraveler: any,
    agencyId?: string,
    eventName?: string,
    customRefundAmount?: number,
    customRefundCurrency?: string,
  ): Promise<void> {
    const oldStatus = oldTraveler.payment_status;
    const newStatus = newTraveler.payment_status;
    const travelerName =
      `${newTraveler.first_name || ''} ${newTraveler.last_name || ''}`.trim();

    // If changing from unpaid/partial to paid, settle the debt and record income
    if (newStatus === PaymentStatusTypes.PAID) {
      if (oldStatus === PaymentStatusTypes.UNPAID) {
        // Delete existing debt transaction and create income
        await this.transactionService.deleteByEventTraveler(
          eventId,
          travelerId,
        );
        await this.transactionService.create({
          amount: newTraveler.price,
          currency: newTraveler.currency,
          type: TransactionTypes.INCOME,
          status: TransactionStatus.SETTLED,
          event: eventId,
          travelerId: travelerId,
          agency: agencyId,
          description: `Ngjarje: ${eventName} - Udhëtar: ${travelerName} (Paguar)`,
        });
      } else if (oldStatus === PaymentStatusTypes.PARTIALLY_PAID) {
        // Delete debt portion and create income for remaining
        await this.transactionService.deleteByEventTraveler(
          eventId,
          `${travelerId}_debt`,
        );
        const remainingAmount =
          newTraveler.price - (oldTraveler.paid_amount || 0);
        if (remainingAmount > 0) {
          await this.transactionService.create({
            amount: remainingAmount,
            currency: newTraveler.currency,
            type: TransactionTypes.INCOME,
            status: TransactionStatus.SETTLED,
            event: eventId,
            travelerId: `${travelerId}_final`,
            agency: agencyId,
            description: `Ngjarje: ${eventName} - Udhëtar: ${travelerName} (Pagesa finale)`,
          });
        }
      }
    } else if (newStatus === PaymentStatusTypes.PARTIALLY_PAID) {
      const paidAmount = newTraveler.paid_amount || 0;
      const previousPaidAmount = oldTraveler.paid_amount || 0;

      if (paidAmount > previousPaidAmount) {
        // New payment received
        const newPayment = paidAmount - previousPaidAmount;
        await this.transactionService.create({
          amount: newPayment,
          currency: newTraveler.currency,
          type: TransactionTypes.INCOME,
          status: TransactionStatus.SETTLED,
          event: eventId,
          travelerId: `${travelerId}_payment_${Date.now()}`,
          agency: agencyId,
          description: `Ngjarje: ${eventName} - Udhëtar: ${travelerName} (Pagesa e pjesshme)`,
        });
      } else if (paidAmount < previousPaidAmount) {
        // Refund given
        const refundAmount = previousPaidAmount - paidAmount;
        await this.transactionService.create({
          amount: refundAmount,
          currency: newTraveler.currency,
          type: TransactionTypes.OUTCOME,
          status: TransactionStatus.SETTLED,
          event: eventId,
          travelerId: `${travelerId}_refund_${Date.now()}`,
          agency: agencyId,
          description: `Rimbursim - Ngjarje: ${eventName} - Udhëtar: ${travelerName} (Pjesërisht)`,
        });
      }

      // Update remaining debt
      const remainingDebt = newTraveler.price - paidAmount;
      if (remainingDebt > 0) {
        const existingDebt = await this.transactionService.findByEventTraveler(eventId, `${travelerId}_debt`);
        if (existingDebt) {
          await this.transactionService.updateByEventTraveler(
            eventId,
            `${travelerId}_debt`,
            {
              amount: remainingDebt,
              description: `Borxh - Ngjarje: ${eventName} - Udhëtar: ${travelerName} (Mbetja: ${remainingDebt})`,
            },
          );
        } else {
          await this.transactionService.create({
            amount: remainingDebt,
            currency: newTraveler.currency,
            type: TransactionTypes.DEBT,
            status: TransactionStatus.PENDING,
            event: eventId,
            travelerId: `${travelerId}_debt`,
            agency: agencyId,
            description: `Borxh - Ngjarje: ${eventName} - Udhëtar: ${travelerName}`,
          });
        }
      } else {
        await this.transactionService.deleteByEventTraveler(eventId, `${travelerId}_debt`);
      }
    } else if (newStatus === PaymentStatusTypes.REFUNDED) {
      const refundAmount = customRefundAmount !== undefined ? customRefundAmount : (oldTraveler.paid_amount || 0);
      const refundCurrency = customRefundCurrency || newTraveler.currency;

      if (refundAmount > 0) {
        await this.transactionService.create({
          amount: refundAmount,
          currency: refundCurrency,
          type: TransactionTypes.OUTCOME,
          status: TransactionStatus.SETTLED,
          event: eventId,
          travelerId: `${travelerId}_refund_${Date.now()}`,
          agency: agencyId,
          description: `Rimbursim - Ngjarje: ${eventName} - Udhëtar: ${travelerName}${customRefundAmount !== undefined ? ' (Shumë e personalizuar)' : ' (i plotë)'}`,
        });
      }
      // Delete any existing transactions for this traveler to clear history
      await this.transactionService.deleteByEventTraveler(eventId, travelerId);
      await this.transactionService.deleteByEventTraveler(eventId, `${travelerId}_debt`);
    } else if (
      newStatus === PaymentStatusTypes.UNPAID &&
      oldStatus !== PaymentStatusTypes.UNPAID
    ) {
      // Changing to unpaid - delete all related transactions and create new debt
      await this.transactionService.deleteByEventTraveler(eventId, travelerId);
      await this.transactionService.deleteByEventTraveler(
        eventId,
        `${travelerId}_debt`,
      );

      await this.transactionService.create({
        amount: newTraveler.price,
        currency: newTraveler.currency,
        type: TransactionTypes.DEBT,
        status: TransactionStatus.PENDING,
        event: eventId,
        travelerId: travelerId,
        agency: agencyId,
        description: `Borxh - Ngjarje: ${eventName} - Udhëtar: ${travelerName}`,
      });
    }
  }

  async updateTravelerPaymentStatus(
    eventId: string,
    travelerId: string,
    paymentStatus: PaymentStatusTypes,
    paidAmount?: number,
    performingAgencyId?: string,
    employeeId?: string,
  ): Promise<IEventHotel> {
    const event = await this.eventModel.findById(eventId);

    if (!event) {
      throw new NotFoundException('Ngjarja nuk u gjet');
    }

    const travelerIndex = event.travelers.findIndex(
      (t: any) => t._id.toString() === travelerId,
    );

    if (travelerIndex === -1) {
      throw new NotFoundException('Udhëtari nuk u gjet');
    }

    const oldTraveler = event.travelers[travelerIndex].toObject();
    event.travelers[travelerIndex].payment_status = paymentStatus;

    if (paidAmount !== undefined) {
      event.travelers[travelerIndex].paid_amount = paidAmount;
    }

    // Auto-calculate paid_amount based on status
    if (paymentStatus === PaymentStatusTypes.PAID) {
      event.travelers[travelerIndex].paid_amount =
        event.travelers[travelerIndex].price || 0;
    } else if (paymentStatus === PaymentStatusTypes.UNPAID) {
      event.travelers[travelerIndex].paid_amount = 0;
    }

    const savedEvent = await event.save();

    // Add log
    const updatedTraveler = event.travelers[travelerIndex];
    await this.addLog(
      eventId,
      'Pagesa u përditësua',
      `U përditësua statusi i pagesës për udhëtarin: ${updatedTraveler.first_name} ${updatedTraveler.last_name}. Statusi i ri: ${paymentStatus}`,
      employeeId
    );

    await this.handlePaymentStatusChange(
      eventId,
      travelerId,
      oldTraveler,
      event.travelers[travelerIndex].toObject(),
      performingAgencyId || event.agency?.toString(),
      event.name,
    );

    return savedEvent;
  }

  async removeTraveler(
    eventId: string,
    travelerId: string,
    employeeId?: string,
  ): Promise<IEventHotel> {
    const event = await this.eventModel.findById(eventId);

    if (!event) {
      throw new NotFoundException('Ngjarja nuk u gjet');
    }

    const travelerIndex = event.travelers.findIndex(
      (t: any) => t._id.toString() === travelerId,
    );

    if (travelerIndex === -1) {
      throw new NotFoundException('Udhëtari nuk u gjet');
    }

    const traveler = event.travelers[travelerIndex];
    event.travelers[travelerIndex].status = 'cancelled';
    event.markModified('travelers');

    await this.addLog(
      eventId,
      'Udhëtari u anulua',
      `Udhëtari ${traveler.first_name} ${traveler.last_name} u anulua nga ngjarja`,
      employeeId
    );

    return await event.save();
  }

  async reactivateTraveler(
    eventId: string,
    travelerId: string,
    employeeId?: string,
  ): Promise<IEventHotel> {
    const event = await this.eventModel.findById(eventId);

    if (!event) {
      throw new NotFoundException('Ngjarja nuk u gjet');
    }

    const travelerIndex = event.travelers.findIndex(
      (t: any) => t._id.toString() === travelerId,
    );

    if (travelerIndex === -1) {
      throw new NotFoundException('Udhëtari nuk u gjet');
    }

    const traveler = event.travelers[travelerIndex];
    event.travelers[travelerIndex].status = 'active';
    event.markModified('travelers');

    await this.addLog(
      eventId,
      'Udhëtari u reaktivizua',
      `Udhëtari ${traveler.first_name} ${traveler.last_name} u reaktivizua në ngjarje`,
      employeeId
    );

    return await event.save();
  }

  async assignBus(
    eventId: string,
    assignBusDto: AssignBusDto,
  ): Promise<IEventHotel> {
    const event = await this.eventModel.findById(eventId);

    if (!event) {
      throw new NotFoundException('Ngjarja nuk u gjet');
    }

    const busObjectId = new Types.ObjectId(assignBusDto.bus_id);

    if (!event.buses.some((b: any) => b.toString() === assignBusDto.bus_id)) {
      event.buses.push(busObjectId);
    }

    const assignedTravelers = event.travelers.filter((t: any) =>
      assignBusDto.traveler_ids.includes(t._id.toString()),
    );

    event.travelers = event.travelers.map((traveler: any) => {
      if (assignBusDto.traveler_ids.includes(traveler._id.toString())) {
        return { ...traveler.toObject(), bus: busObjectId };
      }
      return traveler;
    });

    const savedEvent = await event.save();

    // Add log
    if (assignedTravelers.length > 0) {
      const travelerNames = assignedTravelers
        .map((t: any) => `${t.first_name} ${t.last_name}`)
        .join(', ');
      await this.addLog(
        eventId,
        'Autobusi u caktua',
        `U caktua autobusi për udhëtarët: ${travelerNames}`,
        assignBusDto.employee,
      );
    }

    return savedEvent;
  }

  async getTravelersByBus(eventId: string): Promise<any> {
    const event = await this.findOne(eventId);
    const travelersByBus: any = {};

    event.travelers.forEach((traveler: any) => {
      const busId = traveler.bus?._id?.toString() || 'unassigned';
      const busName = traveler.bus?.name || 'Pa autobus';

      if (!travelersByBus[busId]) {
        travelersByBus[busId] = {
          bus: traveler.bus || null,
          busName,
          travelers: [],
        };
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
        travelersByHotel[hotelId] = {
          hotel: traveler.hotel || null,
          hotelName,
          travelers: [],
        };
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

  async updatePrintColumns(
    eventId: string,
    printColumns: any,
  ): Promise<IEventHotel> {
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

  async refundTravelers(
    eventId: string,
    refundDto: RefundTravelerDto,
  ): Promise<IEventHotel> {
    const event = await this.eventModel.findById(eventId);
    if (!event) {
      throw new NotFoundException('Ngjarja nuk u gjet');
    }

    const { items, note, agency, employee } = refundDto;

    for (const item of items) {
      const { traveler_id, amount, currency } = item;
      const travelerIndex = event.travelers.findIndex(
        (t: any) => t._id.toString() === traveler_id,
      );

      if (travelerIndex !== -1) {
        const oldTraveler = event.travelers[travelerIndex].toObject();

        // Record the refund transaction using the REFUNDED status logic
        await this.handlePaymentStatusChange(
          eventId,
          traveler_id,
          oldTraveler,
          { ...oldTraveler, payment_status: PaymentStatusTypes.REFUNDED },
          agency || event.agency?.toString(),
          event.name,
          amount,
          currency
        );

        // Set the final status to UNPAID/NOT_PAID as requested
        event.travelers[travelerIndex].payment_status = PaymentStatusTypes.UNPAID;
        event.travelers[travelerIndex].paid_amount = 0;
        event.travelers[travelerIndex].note = note
          ? `${event.travelers[travelerIndex].note || ''}\n\nRimbursimi: ${note}`.trim()
          : event.travelers[travelerIndex].note;
      }
    }

    const savedEvent = await event.save();

    // Add log
    const refundedTravelerIds = items.map(i => i.traveler_id);
    const refundedTravelers = event.travelers.filter((t: any) => refundedTravelerIds.includes(t._id.toString()));
    const travelerNames = refundedTravelers.map((t: any) => `${t.first_name} ${t.last_name}`).join(', ');

    await this.addLog(
      eventId,
      'Rimbursim',
      `U krye rimbursimi për udhëtarët: ${travelerNames}${note ? `. Shënim: ${note}` : ''}`,
      employee
    );

    return savedEvent;
  }

  private async addLog(
    eventId: string,
    title: string,
    description: string,
    employeeId?: string,
  ) {
    try {
      await this.eventModel.findByIdAndUpdate(eventId, {
        $push: {
          logs: {
            title,
            description,
            employee: employeeId && Types.ObjectId.isValid(employeeId) ? new Types.ObjectId(employeeId) : undefined,
            created_at: new Date(),
          },
        },
      });
    } catch (e) {
      console.error('Failed to add log:', e);
    }
  }
}
