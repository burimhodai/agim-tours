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
import { CurrencyTypes } from 'src/shared/types/currency.types';

@Injectable()
export class TransactionServiceService {
  constructor(
    @InjectModel('Transaction') private transactionModel: Model<ITransaction>,
    @InjectModel('Agency') private agencyModel: Model<any>,
  ) { }

  private CURRENCY_MAP: Record<string, string> = {
    euro: 'EUR',
    chf: 'CHF',
    mkd: 'MKD',
    eur: 'EUR',
  };

  private ratesCache: {
    rates: Record<string, Record<string, number>>;
    timestamp: number;
  } = {
    rates: {},
    timestamp: 0,
  };

  private CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  private async fetchExchangeRates(from: string): Promise<Record<string, number>> {
    const normalizedFrom = from.toLowerCase();
    const isoFrom = this.CURRENCY_MAP[normalizedFrom] || from.toUpperCase();

    // Check cache
    const now = Date.now();
    if (this.ratesCache.rates[isoFrom] && now - this.ratesCache.timestamp < this.CACHE_DURATION) {
      return this.ratesCache.rates[isoFrom];
    }

    try {
      // MKD is not supported by Frankfurter API, so we'll use a fixed rate
      if (isoFrom === 'MKD') {
        const mkdRates = {
          EUR: 1 / 61.5,
          CHF: 1 / 64,
          MKD: 1,
        };
        this.ratesCache.rates['MKD'] = mkdRates;
        this.ratesCache.timestamp = now;
        return mkdRates;
      }

      const response = await fetch(`https://api.frankfurter.app/latest?from=${isoFrom}`);
      const data: any = await response.json();

      const rates = { ...data.rates };
      rates[isoFrom] = 1;

      if (isoFrom === 'EUR') {
        rates['MKD'] = 61.5;
      } else if (isoFrom === 'CHF') {
        rates['MKD'] = 64;
      }

      this.ratesCache.rates[isoFrom] = rates;
      this.ratesCache.timestamp = now;
      return rates;
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      const fallbackRates: Record<string, Record<string, number>> = {
        EUR: { EUR: 1, CHF: 0.94, MKD: 61.5 },
        CHF: { EUR: 1.06, CHF: 1, MKD: 64 },
        MKD: { EUR: 0.016, CHF: 0.015, MKD: 1 },
      };
      return fallbackRates[isoFrom] || { EUR: 1, CHF: 1, MKD: 1 };
    }
  }

  public async convertCurrency(
    amount: number,
    from: string,
    to: string,
  ): Promise<number> {
    const normalizedFrom = from.toLowerCase();
    const normalizedTo = to.toLowerCase();

    if (normalizedFrom === normalizedTo) return amount;

    const isoTo = this.CURRENCY_MAP[normalizedTo] || to.toUpperCase();
    const rates = await this.fetchExchangeRates(normalizedFrom);

    const rate = rates[isoTo];
    if (!rate) {
      console.warn(`No exchange rate found for ${from} to ${to}`);
      return amount;
    }

    return amount * rate;
  }

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
      agency: createTransactionDto.agency && Types.ObjectId.isValid(createTransactionDto.agency)
        ? new Types.ObjectId(createTransactionDto.agency)
        : undefined,
      user: createTransactionDto.user && Types.ObjectId.isValid(createTransactionDto.user)
        ? new Types.ObjectId(createTransactionDto.user)
        : undefined,
      ticket: createTransactionDto.ticket && Types.ObjectId.isValid(createTransactionDto.ticket)
        ? new Types.ObjectId(createTransactionDto.ticket)
        : undefined,
      event: createTransactionDto.event && Types.ObjectId.isValid(createTransactionDto.event)
        ? new Types.ObjectId(createTransactionDto.event)
        : undefined,
      organizedTravel: createTransactionDto.organizedTravel && Types.ObjectId.isValid(createTransactionDto.organizedTravel)
        ? new Types.ObjectId(createTransactionDto.organizedTravel)
        : undefined,
      airportTransport: (createTransactionDto as any).airportTransport && Types.ObjectId.isValid((createTransactionDto as any).airportTransport)
        ? new Types.ObjectId((createTransactionDto as any).airportTransport)
        : undefined,
      driverReport: (createTransactionDto as any).driverReport && Types.ObjectId.isValid((createTransactionDto as any).driverReport)
        ? new Types.ObjectId((createTransactionDto as any).driverReport)
        : undefined,
      hotelReservation: (createTransactionDto as any).hotelReservation && Types.ObjectId.isValid((createTransactionDto as any).hotelReservation)
        ? new Types.ObjectId((createTransactionDto as any).hotelReservation)
        : undefined,
      travelerId: createTransactionDto.travelerId,
    };

    const newTransaction = new this.transactionModel(transactionData);
    const savedTransaction = await newTransaction.save();
    return await savedTransaction.populate([
      { path: 'user', select: 'email first_name last_name' },
      { path: 'agency' },
      { path: 'ticket' },
      { path: 'hotelReservation' },
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

  async findByTicketDebt(ticketId: string): Promise<ITransaction | null> {
    if (!Types.ObjectId.isValid(ticketId)) {
      return null;
    }

    return await this.transactionModel
      .findOne({
        ticket: new Types.ObjectId(ticketId),
        type: TransactionTypes.DEBT,
        status: TransactionStatus.PENDING,
      })
      .exec();
  }

  async findAllByTicket(ticketId: string): Promise<ITransaction[]> {
    if (!Types.ObjectId.isValid(ticketId)) {
      return [];
    }

    return await this.transactionModel
      .find({ ticket: new Types.ObjectId(ticketId) })
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

  async updateDebtByTicket(
    ticketId: string,
    updateData: UpdateTransactionDto,
  ): Promise<ITransaction | null> {
    if (!Types.ObjectId.isValid(ticketId)) {
      return null;
    }

    return await this.transactionModel
      .findOneAndUpdate(
        {
          ticket: new Types.ObjectId(ticketId),
          type: TransactionTypes.DEBT,
          status: TransactionStatus.PENDING,
        },
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
    paymentCurrency?: string,
    agencyId?: string,
    userId?: string,
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

    if (agencyId) debtTransaction.agency = new Types.ObjectId(agencyId);
    if (userId) debtTransaction.user = new Types.ObjectId(userId);

    let convertedAmount = paidAmount;
    if (
      paymentCurrency &&
      debtTransaction.currency &&
      paymentCurrency.toLowerCase() !== debtTransaction.currency.toLowerCase()
    ) {
      convertedAmount = await this.convertCurrency(
        paidAmount,
        paymentCurrency,
        debtTransaction.currency,
      );
    }

    const newAmount = (debtTransaction.amount || 0) - convertedAmount;

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

  async reduceDebtByHotelReservation(
    reservationId: string,
    paidAmount: number,
    paymentCurrency?: string,
    agencyId?: string,
    userId?: string,
  ): Promise<ITransaction | null> {
    if (!Types.ObjectId.isValid(reservationId)) {
      return null;
    }

    const debtTransaction = await this.transactionModel
      .findOne({
        hotelReservation: new Types.ObjectId(reservationId),
        type: TransactionTypes.DEBT,
        status: TransactionStatus.PENDING,
      })
      .exec();

    if (!debtTransaction) {
      return null;
    }

    if (agencyId) debtTransaction.agency = new Types.ObjectId(agencyId);
    if (userId) debtTransaction.user = new Types.ObjectId(userId);

    let convertedAmount = paidAmount;
    if (
      paymentCurrency &&
      debtTransaction.currency &&
      paymentCurrency.toLowerCase() !== debtTransaction.currency.toLowerCase()
    ) {
      convertedAmount = await this.convertCurrency(
        paidAmount,
        paymentCurrency,
        debtTransaction.currency,
      );
    }

    const newAmount = (debtTransaction.amount || 0) - convertedAmount;

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

  async deleteByEvent(eventId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(eventId)) {
      return false;
    }

    const result = await this.transactionModel
      .deleteMany({ event: new Types.ObjectId(eventId) })
      .exec();

    return result.deletedCount > 0;
  }

  async deleteByOrganizedTravel(organizedTravelId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(organizedTravelId)) {
      return false;
    }

    const result = await this.transactionModel
      .deleteMany({ organizedTravel: new Types.ObjectId(organizedTravelId) })
      .exec();

    return result.deletedCount > 0;
  }

  async deleteByAirportTransport(airportTransportId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(airportTransportId)) {
      return false;
    }

    const result = await this.transactionModel
      .deleteMany({ airportTransport: new Types.ObjectId(airportTransportId) })
      .exec();

    return result.deletedCount > 0;
  }

  async deleteByDriverReport(driverReportId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(driverReportId)) {
      return false;
    }

    const result = await this.transactionModel
      .deleteMany({ driverReport: new Types.ObjectId(driverReportId) })
      .exec();

    return result.deletedCount > 0;
  }

  async deleteByHotelReservation(reservationId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(reservationId)) {
      return false;
    }

    const result = await this.transactionModel
      .deleteMany({ hotelReservation: new Types.ObjectId(reservationId) })
      .exec();

    return result.deletedCount > 0;
  }

  async findDebtByHotelReservation(reservationId: string): Promise<ITransaction | null> {
    if (!Types.ObjectId.isValid(reservationId)) {
      return null;
    }

    return await this.transactionModel
      .findOne({
        hotelReservation: new Types.ObjectId(reservationId),
        type: TransactionTypes.DEBT,
        status: TransactionStatus.PENDING,
      })
      .exec();
  }

  async updateByDriverReport(
    driverReportId: string,
    updateData: UpdateTransactionDto,
  ): Promise<ITransaction | null> {
    if (!Types.ObjectId.isValid(driverReportId)) {
      return null;
    }

    return await this.transactionModel
      .findOneAndUpdate(
        { driverReport: new Types.ObjectId(driverReportId) },
        { $set: updateData },
        { new: true },
      )
      .exec();
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
      .populate('hotelReservation')
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
      .populate('hotelReservation')
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

  async handleTicketPriceChange(
    ticketId: string,
    oldPrice: number,
    newPrice: number,
    currency: string,
    agencyId: string,
    userId: string,
  ) {
    const diff = newPrice - oldPrice;
    if (diff === 0) return;

    let debtTx = await this.transactionModel.findOne({
      ticket: new Types.ObjectId(ticketId),
      type: TransactionTypes.DEBT,
      status: TransactionStatus.PENDING,
    });

    if (debtTx) {
      if (agencyId) debtTx.agency = new Types.ObjectId(agencyId);
      if (userId) debtTx.user = new Types.ObjectId(userId);

      debtTx.amount += diff;
      if (debtTx.amount <= 0) {
        debtTx.amount = 0;
        debtTx.status = TransactionStatus.SETTLED;
        debtTx.type = TransactionTypes.INCOME;
        debtTx.description = (debtTx.description || '')
          .replace('Borxh - ', '')
          .replace(' e papaguar', ' - Paguar plotësisht');
      }
      await debtTx.save();
    } else if (diff > 0) {
      await this.create({
        amount: diff,
        currency: currency as any,
        type: TransactionTypes.DEBT,
        status: TransactionStatus.PENDING,
        ticket: ticketId,
        agency: agencyId,
        user: userId,
        description: `Borxh nga rritja e çmimit - Biletë avioni`,
      });
    }
  }

  async remove(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid transaction ID');
    }

    const result = await this.transactionModel.deleteOne({ _id: id }).exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException('Transaction not found');
    }

    return true;
  }
}
