import { Injectable, NotFoundException } from '@nestjs/common';
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
import { PaymentStatusTypes } from 'src/shared/types/payment.types';
import {
  TransactionTypes,
  TransactionStatus,
} from 'src/shared/types/transaction.types';
import { TransactionServiceService } from 'src/transactions/transaction-service.service';

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
    @InjectModel('OrganizedTravel')
    private travelModel: Model<IOrganizedTravel>,
    private transactionService: TransactionServiceService,
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

  async update(
    id: string,
    updateDto: UpdateOrganizedTravelDto,
  ): Promise<IOrganizedTravel> {
    const updateData: any = { ...updateDto };

    if (updateDto.buses) {
      updateData.buses = updateDto.buses
        .filter((busId) => busId && busId !== '')
        .map((busId) => new Types.ObjectId(busId));
    }

    if (updateDto.agency && updateDto.agency !== '') {
      updateData.agency = new Types.ObjectId(updateDto.agency);
    } else if (updateDto.agency === '') {
      updateData.agency = undefined;
    }

    if (updateDto.employee && updateDto.employee !== '') {
      updateData.employee = new Types.ObjectId(updateDto.employee);
    } else if (updateDto.employee === '') {
      updateData.employee = undefined;
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

  async addTravelers(
    id: string,
    addTravelersDto: AddOrganizedTravelersDto,
  ): Promise<IOrganizedTravel> {
    const travel = await this.travelModel.findById(id);

    if (!travel) {
      throw new NotFoundException('Udhëtimi nuk u gjet');
    }

    const batchGroupId = `G-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const processedTravelers = addTravelersDto.travelers.map((traveler) => ({
      ...traveler,
      group_id: traveler.group_id || batchGroupId,
      bus: traveler.bus ? new Types.ObjectId(traveler.bus) : undefined,
    }));

    travel.travelers.push(...processedTravelers);
    const savedTravel = await travel.save();

    // Create transactions for each traveler with a price
    for (const traveler of savedTravel.travelers.slice(
      -processedTravelers.length,
    )) {
      if (traveler.price && traveler.price > 0) {
        await this.createTravelerTransaction(
          savedTravel._id.toString(),
          traveler._id.toString(),
          traveler,
          savedTravel.agency?.toString(),
          savedTravel.name,
        );
      }
    }

    return savedTravel;
  }

  private async createTravelerTransaction(
    travelId: string,
    travelerId: string,
    traveler: any,
    agencyId?: string,
    travelName?: string,
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
        organizedTravel: travelId,
        travelerId: travelerId,
        agency: agencyId,
        description: `Udhëtim i organizuar: ${travelName} - Udhëtar: ${travelerName}`,
      });
    } else if (isPartiallyPaid && traveler.paid_amount > 0) {
      // Partially paid - create income for paid amount and debt for remaining
      await this.transactionService.create({
        amount: traveler.paid_amount,
        currency: traveler.currency,
        type: TransactionTypes.INCOME,
        status: TransactionStatus.SETTLED,
        organizedTravel: travelId,
        travelerId: travelerId,
        agency: agencyId,
        description: `Udhëtim i organizuar: ${travelName} - Udhëtar: ${travelerName} (Pagesa e pjesshme)`,
      });

      const remainingAmount = traveler.price - traveler.paid_amount;
      if (remainingAmount > 0) {
        await this.transactionService.create({
          amount: remainingAmount,
          currency: traveler.currency,
          type: TransactionTypes.DEBT,
          status: TransactionStatus.PENDING,
          organizedTravel: travelId,
          travelerId: `${travelerId}_debt`,
          agency: agencyId,
          description: `Borxh - Udhëtim i organizuar: ${travelName} - Udhëtar: ${travelerName}`,
        });
      }
    } else if (isUnpaid) {
      // Unpaid - create debt transaction
      await this.transactionService.create({
        amount: traveler.price,
        currency: traveler.currency,
        type: TransactionTypes.DEBT,
        status: TransactionStatus.PENDING,
        organizedTravel: travelId,
        travelerId: travelerId,
        agency: agencyId,
        description: `Borxh - Udhëtim i organizuar: ${travelName} - Udhëtar: ${travelerName}`,
      });
    }
  }

  async updateTravelersGroup(
    travelId: string,
    groupId: string,
    travelersData: OrganizedTravelerDto[],
  ): Promise<IOrganizedTravel> {
    const travel = await this.travelModel.findById(travelId);
    if (!travel) throw new NotFoundException("Udhëtimi nuk u gjet");

    const otherTravelers = travel.travelers.filter(
      (t: any) => t.group_id !== groupId
    );
    const existingGroupTravelers = travel.travelers.filter(
      (t: any) => t.group_id === groupId
    );

    const processedTravelers = [];

    for (const data of travelersData) {
      const existing = existingGroupTravelers.find(
        (t: any) => t._id?.toString() === data._id
      );

      const travelerData: any = {
        ...(existing?.toObject() || {}),
        ...data,
        group_id: groupId,
        bus:
          data.bus && data.bus !== ""
            ? new Types.ObjectId(data.bus)
            : existing?.bus,
      };

      processedTravelers.push(travelerData);
    }

    travel.travelers = [...otherTravelers, ...processedTravelers];
    const savedTravel = await travel.save();

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
          travelId,
          newTraveler._id.toString(),
          oldTraveler.toObject(),
          newTraveler,
          travel.agency?.toString(),
          travel.name
        );
      } else if (!oldTraveler && newTraveler.price > 0) {
        const createdTraveler = savedTravel.travelers.find(
          (t: any) =>
            t.first_name === newTraveler.first_name &&
            t.last_name === newTraveler.last_name &&
            t.group_id === groupId
        );
        if (createdTraveler) {
          await this.createTravelerTransaction(
            travelId,
            createdTraveler._id.toString(),
            createdTraveler,
            travel.agency?.toString(),
            travel.name
          );
        }
      }
    }

    return savedTravel;
  }

  async updateTraveler(
    travelId: string,
    travelerId: string,
    travelerData: OrganizedTravelerDto,
  ): Promise<IOrganizedTravel> {
    const travel = await this.travelModel.findById(travelId);

    if (!travel) {
      throw new NotFoundException('Udhëtimi nuk u gjet');
    }

    const travelerIndex = travel.travelers.findIndex(
      (t: any) => t._id.toString() === travelerId,
    );

    if (travelerIndex === -1) {
      throw new NotFoundException('Udhëtari nuk u gjet');
    }

    const oldTraveler = travel.travelers[travelerIndex].toObject();
    const updatedTraveler = {
      ...oldTraveler,
      ...travelerData,
      bus: travelerData.bus
        ? new Types.ObjectId(travelerData.bus)
        : travel.travelers[travelerIndex].bus,
    };

    travel.travelers[travelerIndex] = updatedTraveler;
    const savedTravel = await travel.save();

    // Handle payment status change
    if (
      travelerData.payment_status &&
      travelerData.payment_status !== oldTraveler.payment_status
    ) {
      await this.handlePaymentStatusChange(
        travelId,
        travelerId,
        oldTraveler,
        updatedTraveler,
        travel.agency?.toString(),
        travel.name,
      );
    }

    return savedTravel;
  }

  private async handlePaymentStatusChange(
    travelId: string,
    travelerId: string,
    oldTraveler: any,
    newTraveler: any,
    agencyId?: string,
    travelName?: string,
  ): Promise<void> {
    const oldStatus = oldTraveler.payment_status;
    const newStatus = newTraveler.payment_status;
    const travelerName =
      `${newTraveler.first_name || ''} ${newTraveler.last_name || ''}`.trim();

    // If changing from unpaid/partial to paid, settle the debt and record income
    if (newStatus === PaymentStatusTypes.PAID) {
      if (oldStatus === PaymentStatusTypes.UNPAID) {
        // Delete existing debt transaction and create income
        await this.transactionService.deleteByOrganizedTravelTraveler(
          travelId,
          travelerId,
        );
        await this.transactionService.create({
          amount: newTraveler.price,
          currency: newTraveler.currency,
          type: TransactionTypes.INCOME,
          status: TransactionStatus.SETTLED,
          organizedTravel: travelId,
          travelerId: travelerId,
          agency: agencyId,
          description: `Udhëtim i organizuar: ${travelName} - Udhëtar: ${travelerName} (Paguar)`,
        });
      } else if (oldStatus === PaymentStatusTypes.PARTIALLY_PAID) {
        // Delete debt portion and create income for remaining
        await this.transactionService.deleteByOrganizedTravelTraveler(
          travelId,
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
            organizedTravel: travelId,
            travelerId: `${travelerId}_final`,
            agency: agencyId,
            description: `Udhëtim i organizuar: ${travelName} - Udhëtar: ${travelerName} (Pagesa finale)`,
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
          organizedTravel: travelId,
          travelerId: `${travelerId}_payment_${Date.now()}`,
          agency: agencyId,
          description: `Udhëtim i organizuar: ${travelName} - Udhëtar: ${travelerName} (Pagesa e pjesshme)`,
        });
      } else if (paidAmount < previousPaidAmount) {
        // Refund given
        const refundAmount = previousPaidAmount - paidAmount;
        await this.transactionService.create({
          amount: refundAmount,
          currency: newTraveler.currency,
          type: TransactionTypes.OUTCOME,
          status: TransactionStatus.SETTLED,
          organizedTravel: travelId,
          travelerId: `${travelerId}_refund_${Date.now()}`,
          agency: agencyId,
          description: `Rimbursim - Udhëtim i organizuar: ${travelName} - Udhëtar: ${travelerName} (Pjesërisht)`,
        });
      }

      // Update remaining debt
      const remainingDebt = newTraveler.price - paidAmount;
      if (remainingDebt > 0) {
        const existingDebt = await this.transactionService.findByOrganizedTravelTraveler(travelId, `${travelerId}_debt`);
        if (existingDebt) {
          await this.transactionService.updateByOrganizedTravelTraveler(
            travelId,
            `${travelerId}_debt`,
            {
              amount: remainingDebt,
              description: `Borxh - Udhëtim i organizuar: ${travelName} - Udhëtar: ${travelerName} (Mbetja: ${remainingDebt})`,
            },
          );
        } else {
          await this.transactionService.create({
            amount: remainingDebt,
            currency: newTraveler.currency,
            type: TransactionTypes.DEBT,
            status: TransactionStatus.PENDING,
            organizedTravel: travelId,
            travelerId: `${travelerId}_debt`,
            agency: agencyId,
            description: `Borxh - Udhëtim i organizuar: ${travelName} - Udhëtar: ${travelerName}`,
          });
        }
      } else {
        await this.transactionService.deleteByOrganizedTravelTraveler(travelId, `${travelerId}_debt`);
      }
    } else if (newStatus === PaymentStatusTypes.REFUNDED) {
      const previouslyPaid = oldTraveler.paid_amount || 0;
      if (previouslyPaid > 0) {
        await this.transactionService.create({
          amount: previouslyPaid,
          currency: newTraveler.currency,
          type: TransactionTypes.OUTCOME,
          status: TransactionStatus.SETTLED,
          organizedTravel: travelId,
          travelerId: `${travelerId}_refund_${Date.now()}`,
          agency: agencyId,
          description: `Rimbursim i plotë - Udhëtim i organizuar: ${travelName} - Udhëtar: ${travelerName}`,
        });
      }
      // Delete any existing transactions for this traveler to clear history
      await this.transactionService.deleteByOrganizedTravelTraveler(travelId, travelerId);
      await this.transactionService.deleteByOrganizedTravelTraveler(travelId, `${travelerId}_debt`);
    } else if (
      newStatus === PaymentStatusTypes.UNPAID &&
      oldStatus !== PaymentStatusTypes.UNPAID
    ) {
      // Changing to unpaid - delete all related transactions and create new debt
      await this.transactionService.deleteByOrganizedTravelTraveler(
        travelId,
        travelerId,
      );
      await this.transactionService.deleteByOrganizedTravelTraveler(
        travelId,
        `${travelerId}_debt`,
      );

      await this.transactionService.create({
        amount: newTraveler.price,
        currency: newTraveler.currency,
        type: TransactionTypes.DEBT,
        status: TransactionStatus.PENDING,
        organizedTravel: travelId,
        travelerId: travelerId,
        agency: agencyId,
        description: `Borxh - Udhëtim i organizuar: ${travelName} - Udhëtar: ${travelerName}`,
      });
    }
  }

  async updateTravelerPaymentStatus(
    travelId: string,
    travelerId: string,
    paymentStatus: PaymentStatusTypes,
    paidAmount?: number,
  ): Promise<IOrganizedTravel> {
    const travel = await this.travelModel.findById(travelId);

    if (!travel) {
      throw new NotFoundException('Udhëtimi nuk u gjet');
    }

    const travelerIndex = travel.travelers.findIndex(
      (t: any) => t._id.toString() === travelerId,
    );

    if (travelerIndex === -1) {
      throw new NotFoundException('Udhëtari nuk u gjet');
    }

    const oldTraveler = travel.travelers[travelerIndex].toObject();
    travel.travelers[travelerIndex].payment_status = paymentStatus;

    if (paidAmount !== undefined) {
      travel.travelers[travelerIndex].paid_amount = paidAmount;
    }

    // Auto-calculate paid_amount based on status
    if (paymentStatus === PaymentStatusTypes.PAID) {
      travel.travelers[travelerIndex].paid_amount =
        travel.travelers[travelerIndex].price || 0;
    } else if (paymentStatus === PaymentStatusTypes.UNPAID) {
      travel.travelers[travelerIndex].paid_amount = 0;
    }

    const savedTravel = await travel.save();

    await this.handlePaymentStatusChange(
      travelId,
      travelerId,
      oldTraveler,
      travel.travelers[travelerIndex].toObject(),
      travel.agency?.toString(),
      travel.name,
    );

    return savedTravel;
  }

  async removeTraveler(
    travelId: string,
    travelerId: string,
  ): Promise<IOrganizedTravel> {
    const travel = await this.travelModel.findById(travelId);

    if (!travel) {
      throw new NotFoundException('Udhëtimi nuk u gjet');
    }

    // Delete related transactions
    await this.transactionService.deleteByOrganizedTravelTraveler(
      travelId,
      travelerId,
    );
    await this.transactionService.deleteByOrganizedTravelTraveler(
      travelId,
      `${travelerId}_debt`,
    );

    travel.travelers = travel.travelers.filter(
      (t: any) => t._id.toString() !== travelerId,
    );
    return await travel.save();
  }

  async assignBus(
    travelId: string,
    assignBusDto: AssignOrganizedBusDto,
  ): Promise<IOrganizedTravel> {
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

  async getBorderList(travelId: string): Promise<any[]> {
    const travel = await this.findOne(travelId);
    return travel.travelers.filter((t: any) => t.show_in_border_list !== false);
  }

  async getGuideList(travelId: string): Promise<any[]> {
    const travel = await this.findOne(travelId);
    return travel.travelers.filter((t: any) => t.show_in_guide_list !== false);
  }

  async updatePrintColumns(
    travelId: string,
    printColumns: any,
  ): Promise<IOrganizedTravel> {
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
