import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ITransaction,
  TransactionStatus,
  TransactionTypes,
} from 'src/shared/types/transaction.types';
import {
  CreateTransactionDto,
  TransactionQueryDto,
  UpdateTransactionDto,
} from 'src/shared/DTO/transaction.dto';

@Injectable()
export class TransactionServiceService {
  constructor(
    @InjectModel('Transaction') private transactionModel: Model<ITransaction>,
    @InjectModel('Agency') private agencyModel: Model<any>,
  ) { }

  async create(
    createTransactionDto: CreateTransactionDto,
  ): Promise<ITransaction> {
    let description = createTransactionDto.description || '';

    if (createTransactionDto.agency) {
      try {
        const agencyDoc = await this.agencyModel
          .findById(createTransactionDto.agency)
          .select('name')
          .lean();
        if (agencyDoc?.name && !description.includes(agencyDoc.name)) {
          description = description
            ? `${description} - ${agencyDoc.name}`
            : agencyDoc.name;
        }
      } catch (e) { }
    }

    const transactionData = {
      ...createTransactionDto,
      description,
      agency: createTransactionDto.agency
        ? new Types.ObjectId(createTransactionDto.agency)
        : undefined,
      user: createTransactionDto.user
        ? new Types.ObjectId(createTransactionDto.user)
        : undefined,
      ticket: createTransactionDto.ticket
        ? new Types.ObjectId(createTransactionDto.ticket)
        : undefined,
      event: createTransactionDto.event
        ? new Types.ObjectId(createTransactionDto.event)
        : undefined,
      organizedTravel: createTransactionDto.organizedTravel
        ? new Types.ObjectId(createTransactionDto.organizedTravel)
        : undefined,
      travelerId: createTransactionDto.travelerId,
    };

    const newTransaction = new this.transactionModel(transactionData);
    const savedTransaction = await newTransaction.save();
    return await savedTransaction.populate([
      { path: 'user', select: 'email first_name last_name' },
      { path: 'agency' },
    ]);
  }

  async update(
    id: string,
    updateTransactionDto: UpdateTransactionDto,
  ): Promise<ITransaction> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid transaction ID');
    }

    const transaction = await this.transactionModel
      .findByIdAndUpdate(id, { $set: updateTransactionDto }, { new: true })
      .populate('agency')
      .populate('user', 'email first_name last_name')
      .populate('ticket')
      .exec();

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async findByTicket(ticketId: string): Promise<ITransaction | null> {
    if (!Types.ObjectId.isValid(ticketId)) {
      return null;
    }

    return await this.transactionModel
      .findOne({ ticket: new Types.ObjectId(ticketId) })
      .exec();
  }

  async updateByTicket(
    ticketId: string,
    updateData: UpdateTransactionDto,
  ): Promise<ITransaction | null> {
    if (!Types.ObjectId.isValid(ticketId)) {
      return null;
    }

    return await this.transactionModel
      .findOneAndUpdate(
        { ticket: new Types.ObjectId(ticketId) },
        { $set: updateData },
        { new: true },
      )
      .exec();
  }

  async deleteByTicket(ticketId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(ticketId)) {
      return false;
    }

    const result = await this.transactionModel
      .deleteMany({ ticket: new Types.ObjectId(ticketId) })
      .exec();

    return result.deletedCount > 0;
  }

  async settleDebt(ticketId: string): Promise<ITransaction | null> {
    return await this.updateByTicket(ticketId, {
      type: TransactionTypes.INCOME,
      status: TransactionStatus.SETTLED,
    });
  }

  async reduceDebtByTicket(
    ticketId: string,
    paidAmount: number,
  ): Promise<ITransaction | null> {
    if (!Types.ObjectId.isValid(ticketId)) {
      return null;
    }

    const debtTransaction = await this.transactionModel
      .findOne({
        ticket: new Types.ObjectId(ticketId),
        type: TransactionTypes.DEBT,
        status: TransactionStatus.PENDING,
      })
      .exec();

    if (!debtTransaction) {
      return null;
    }

    const newAmount = (debtTransaction.amount || 0) - paidAmount;

    if (newAmount <= 0) {
      debtTransaction.amount = 0;
      debtTransaction.type = TransactionTypes.INCOME;
      debtTransaction.status = TransactionStatus.SETTLED;
      debtTransaction.description = (debtTransaction.description || '')
        .replace('Borxh - ', '')
        .replace(' e papaguar', ' - Paguar plotësisht');
    } else {
      debtTransaction.amount = newAmount;
    }

    return await debtTransaction.save();
  }

  async reduceDebtByEventTraveler(
    eventId: string,
    travelerId: string,
    paidAmount: number,
  ): Promise<ITransaction | null> {
    if (!Types.ObjectId.isValid(eventId)) {
      return null;
    }

    const debtTransaction = await this.transactionModel
      .findOne({
        event: new Types.ObjectId(eventId),
        travelerId: travelerId,
        type: TransactionTypes.DEBT,
        status: TransactionStatus.PENDING,
      })
      .exec();

    if (!debtTransaction) {
      return null;
    }

    const newAmount = (debtTransaction.amount || 0) - paidAmount;

    if (newAmount <= 0) {
      debtTransaction.amount = 0;
      debtTransaction.type = TransactionTypes.INCOME;
      debtTransaction.status = TransactionStatus.SETTLED;
      debtTransaction.description = (debtTransaction.description || '')
        .replace('Borxh - ', '')
        .replace(' e papaguar', ' - Paguar plotësisht');
    } else {
      debtTransaction.amount = newAmount;
    }

    return await debtTransaction.save();
  }

  async reduceDebtByOrganizedTravelTraveler(
    organizedTravelId: string,
    travelerId: string,
    paidAmount: number,
  ): Promise<ITransaction | null> {
    if (!Types.ObjectId.isValid(organizedTravelId)) {
      return null;
    }

    const debtTransaction = await this.transactionModel
      .findOne({
        organizedTravel: new Types.ObjectId(organizedTravelId),
        travelerId: travelerId,
        type: TransactionTypes.DEBT,
        status: TransactionStatus.PENDING,
      })
      .exec();

    if (!debtTransaction) {
      return null;
    }

    const newAmount = (debtTransaction.amount || 0) - paidAmount;

    if (newAmount <= 0) {
      debtTransaction.amount = 0;
      debtTransaction.type = TransactionTypes.INCOME;
      debtTransaction.status = TransactionStatus.SETTLED;
      debtTransaction.description = (debtTransaction.description || '')
        .replace('Borxh - ', '')
        .replace(' e papaguar', ' - Paguar plotësisht');
    } else {
      debtTransaction.amount = newAmount;
    }

    return await debtTransaction.save();
  }

  // Find transaction by event and traveler
  async findByEventTraveler(
    eventId: string,
    travelerId: string,
  ): Promise<ITransaction | null> {
    if (!Types.ObjectId.isValid(eventId)) {
      return null;
    }

    return await this.transactionModel
      .findOne({
        event: new Types.ObjectId(eventId),
        travelerId: travelerId,
      })
      .exec();
  }

  // Find transaction by organized travel and traveler
  async findByOrganizedTravelTraveler(
    organizedTravelId: string,
    travelerId: string,
  ): Promise<ITransaction | null> {
    if (!Types.ObjectId.isValid(organizedTravelId)) {
      return null;
    }

    return await this.transactionModel
      .findOne({
        organizedTravel: new Types.ObjectId(organizedTravelId),
        travelerId: travelerId,
      })
      .exec();
  }

  // Update transaction by event and traveler
  async updateByEventTraveler(
    eventId: string,
    travelerId: string,
    updateData: UpdateTransactionDto,
  ): Promise<ITransaction | null> {
    if (!Types.ObjectId.isValid(eventId)) {
      return null;
    }

    return await this.transactionModel
      .findOneAndUpdate(
        {
          event: new Types.ObjectId(eventId),
          travelerId: travelerId,
        },
        { $set: updateData },
        { new: true },
      )
      .exec();
  }

  // Update transaction by organized travel and traveler
  async updateByOrganizedTravelTraveler(
    organizedTravelId: string,
    travelerId: string,
    updateData: UpdateTransactionDto,
  ): Promise<ITransaction | null> {
    if (!Types.ObjectId.isValid(organizedTravelId)) {
      return null;
    }

    return await this.transactionModel
      .findOneAndUpdate(
        {
          organizedTravel: new Types.ObjectId(organizedTravelId),
          travelerId: travelerId,
        },
        { $set: updateData },
        { new: true },
      )
      .exec();
  }

  // Settle debt for event traveler - creates new income transaction
  async settleEventTravelerDebt(
    eventId: string,
    travelerId: string,
    amount: number,
  ): Promise<ITransaction | null> {
    return await this.updateByEventTraveler(eventId, travelerId, {
      type: TransactionTypes.INCOME,
      status: TransactionStatus.SETTLED,
      amount: amount,
    });
  }

  // Settle debt for organized travel traveler - creates new income transaction
  async settleOrganizedTravelTravelerDebt(
    organizedTravelId: string,
    travelerId: string,
    amount: number,
  ): Promise<ITransaction | null> {
    return await this.updateByOrganizedTravelTraveler(
      organizedTravelId,
      travelerId,
      {
        type: TransactionTypes.INCOME,
        status: TransactionStatus.SETTLED,
        amount: amount,
      },
    );
  }

  // Delete transaction by traveler
  async deleteByEventTraveler(
    eventId: string,
    travelerId: string,
  ): Promise<boolean> {
    if (!Types.ObjectId.isValid(eventId)) {
      return false;
    }

    const result = await this.transactionModel
      .deleteOne({
        event: new Types.ObjectId(eventId),
        travelerId: travelerId,
      })
      .exec();

    return result.deletedCount > 0;
  }

  async deleteByOrganizedTravelTraveler(
    organizedTravelId: string,
    travelerId: string,
  ): Promise<boolean> {
    if (!Types.ObjectId.isValid(organizedTravelId)) {
      return false;
    }

    const result = await this.transactionModel
      .deleteOne({
        organizedTravel: new Types.ObjectId(organizedTravelId),
        travelerId: travelerId,
      })
      .exec();

    return result.deletedCount > 0;
  }

  async findAll(query: TransactionQueryDto): Promise<ITransaction[]> {
    const { date, date_from, date_to, type, status, agency, user } = query;

    const filter: any = {};

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: startOfDay, $lte: endOfDay };
    } else if (date_from || date_to) {
      filter.createdAt = {};
      if (date_from) {
        const startDate = new Date(date_from);
        startDate.setHours(0, 0, 0, 0);
        filter.createdAt.$gte = startDate;
      }
      if (date_to) {
        const endDate = new Date(date_to);
        endDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDate;
      }
    }

    if (type) {
      filter.type = type;
    }

    if (status) {
      filter.status = status;
    }

    if (agency) {
      filter.agency = new Types.ObjectId(agency);
    }

    if (user) {
      filter.user = new Types.ObjectId(user);
    }

    return await this.transactionModel
      .find(filter)
      .populate('agency')
      .populate('user', 'email first_name last_name')
      .populate('ticket')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<ITransaction> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid transaction ID');
    }

    const transaction = await this.transactionModel
      .findById(id)
      .populate('agency')
      .populate('user', 'email first_name last_name')
      .populate('ticket')
      .exec();

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async getDebtsSummary(
    agencyId: string,
  ): Promise<{ total: number; count: number }> {
    const debts = await this.transactionModel
      .find({
        agency: new Types.ObjectId(agencyId),
        type: TransactionTypes.DEBT,
        status: TransactionStatus.PENDING,
      })
      .exec();

    const total = debts.reduce((sum, debt) => sum + (debt.amount || 0), 0);
    return { total, count: debts.length };
  }
}
