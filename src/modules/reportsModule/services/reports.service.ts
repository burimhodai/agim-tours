import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ITransaction,
  TransactionTypes,
} from 'src/shared/types/transaction.types';
import {
  ReportQueryDto,
  ReportResponseDto,
  ReportPeriod,
  CurrencySummary,
  ReportTransactionItem,
} from 'src/shared/DTO/report.dto';
import { PaymentStatusTypes } from 'src/shared/types/payment.types';
import { TicketTypes } from 'src/shared/types/ticket.types';
import { TransactionServiceService } from 'src/transactions/transaction-service.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel('Transaction') private transactionModel: Model<ITransaction>,
    @InjectModel('Ticket') private ticketModel: Model<any>,
    @InjectModel('HotelReservation') private hotelReservationModel: Model<any>,
    private transactionService: TransactionServiceService,
  ) {}

  private async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<number> {
    return await this.transactionService.convertCurrency(
      amount,
      fromCurrency,
      toCurrency,
    );
  }

  async generateReport(query: ReportQueryDto): Promise<ReportResponseDto> {
    const {
      period,
      module,
      agency,
      employee,
      date_from,
      date_to,
      specific_date,
    } = query;

    const dateRange = this.calculateDateRange(
      period,
      specific_date,
      date_from,
      date_to,
    );

    const filter: any = {
      createdAt: {
        $gte: dateRange.from,
        $lte: dateRange.to,
      },
    };

    if (agency) {
      filter.agency = new Types.ObjectId(agency);
    }

    if (employee) {
      filter.user = new Types.ObjectId(employee);
    }

    let allTransactions = await this.transactionModel
      .find(filter)
      .populate('user', 'email first_name last_name')
      .populate('ticket')
      .populate('hotelReservation')
      .sort({ createdAt: -1 })
      .exec();

    // Filter by module if specified (only applies to ticket-based transactions)
    if (module) {
      allTransactions = allTransactions.filter((transaction) => {
        if (module === TicketTypes.HOTEL) {
          return !!transaction.hotelReservation;
        }
        const ticket = transaction.ticket as any;
        return ticket && ticket.ticket_type === module;
      });
    }

    // Include all transactions that are within the date range.
    // The filtering by type (income/outcome) will happen next.
    // Previously there was a filter here that only included transactions for fully paid tickets,
    // which caused refunds and partial payments to be missing from reports.

    const incomeTransactions = allTransactions.filter(
      (t) => t.type === TransactionTypes.INCOME,
    );
    const outcomeTransactions = allTransactions.filter(
      (t) => t.type === TransactionTypes.OUTCOME,
    );

    const incomeItems = this.mapTransactionsToItems(incomeTransactions);
    const outcomeItems = this.mapTransactionsToItems(outcomeTransactions);

    const incomeSummary = this.calculateSummary(incomeTransactions);
    const outcomeSummary = this.calculateSummary(outcomeTransactions);

    const debtTransactions = allTransactions.filter(
      (t) => t.type === TransactionTypes.DEBT,
    );

    const debtItems = this.mapTransactionsToItems(debtTransactions);

    const ticketFilter: any = {
      createdAt: {
        $gte: dateRange.from,
        $lte: dateRange.to,
      },
      status: { $ne: 'canceled' },
      is_deleted: { $ne: true },
    };

    if (agency) {
      ticketFilter.agency = new Types.ObjectId(agency);
    }

    if (employee) {
      ticketFilter.employee = new Types.ObjectId(employee);
    }

    if (module) {
      ticketFilter.ticket_type = module;
    }

    ticketFilter.payment_status = {
      $in: [
        PaymentStatusTypes.UNPAID,
        PaymentStatusTypes.NOT_PAID,
        PaymentStatusTypes.PARTIALLY_PAID,
      ],
    };

    const tickets = await this.ticketModel
      .find(ticketFilter)
      .populate('employee', 'email first_name last_name')
      .sort({ createdAt: -1 })
      .exec();

    const debtTicketIds = new Set(
      debtItems
        .filter((d) => d.ticket?._id)
        .map((d) => d.ticket!._id.toString()),
    );

    for (const ticket of tickets) {
      if (debtTicketIds.has(ticket._id.toString())) {
        continue;
      }

      let totalPaid = 0;
      if (ticket.payment_chunks && ticket.payment_chunks.length > 0) {
        for (const chunk of ticket.payment_chunks) {
          totalPaid += await this.convertCurrency(
            chunk.amount || 0,
            chunk.currency,
            ticket.currency,
          );
        }
      }

      const debtAmount = (ticket.price || 0) - totalPaid;

      if (debtAmount > 0.05) {
        debtItems.push({
          _id: ticket._id.toString(),
          amount: debtAmount,
          currency: ticket.currency,
          type: 'DEBT',
          description: `Borxh për biletën ${ticket.booking_reference || ticket.uid || ''} (${ticket.ticket_type})`,
          createdAt: ticket.createdAt,
          user: ticket.employee
            ? {
                _id: ticket.employee._id.toString(),
                email: ticket.employee.email,
                first_name: ticket.employee.first_name,
                last_name: ticket.employee.last_name,
              }
            : undefined,
          ticket: {
            _id: ticket._id.toString(),
            ticket_type: ticket.ticket_type,
            booking_reference: ticket.booking_reference,
            departure_location: ticket.departure_location,
            destination_location: ticket.destination_location,
            departure_date: ticket.departure_date,
            passengers: ticket.passengers,
            operator: ticket.operator,
            price: ticket.price,
            payment_status: ticket.payment_status,
            payment_chunks: ticket.payment_chunks,
          },
        });
      }
    }

    // Add Hotel Reservation debts
    if (!module || module === TicketTypes.HOTEL) {
      const hotelFilter: any = {
        createdAt: {
          $gte: dateRange.from,
          $lte: dateRange.to,
        },
        payment_status: { $in: ['not_paid', 'partially_paid'] },
        is_deleted: { $ne: true },
      };

      if (agency) hotelFilter.agency = new Types.ObjectId(agency);
      if (employee) hotelFilter.employee = new Types.ObjectId(employee);

      const hotelReservations = await this.hotelReservationModel
        .find(hotelFilter)
        .populate('employee', 'email first_name last_name')
        .sort({ createdAt: -1 })
        .exec();

      for (const hotel of hotelReservations) {
        if (debtTicketIds.has(hotel._id.toString())) continue;

        let totalPaid = 0;
        if (hotel.payment_chunks && hotel.payment_chunks.length > 0) {
          for (const chunk of hotel.payment_chunks) {
            totalPaid += await this.convertCurrency(
              chunk.amount || 0,
              chunk.currency,
              hotel.currency,
            );
          }
        }

        const debtAmount = (hotel.price || 0) - totalPaid;
        if (debtAmount > 0.05) {
          debtItems.push({
            _id: hotel._id.toString(),
            amount: debtAmount,
            currency: hotel.currency,
            type: 'DEBT',
            description: `Borxh për hotelin ${hotel.hotel_name} (${hotel.hotel_booking_id})`,
            createdAt: hotel.createdAt,
            user: hotel.employee
              ? {
                  _id: hotel.employee._id.toString(),
                  email: hotel.employee.email,
                  first_name: hotel.employee.first_name,
                  last_name: hotel.employee.last_name,
                }
              : undefined,
            ticket: {
              _id: hotel._id.toString(),
              ticket_type: TicketTypes.HOTEL,
              booking_reference: hotel.hotel_booking_id,
              destination_location: hotel.hotel_name,
              departure_date: hotel.check_in_date,
              price: hotel.price,
              payment_status: hotel.payment_status,
              payment_chunks: hotel.payment_chunks || [],
            } as any,
          });
        }
      }
    }

    const debtSummary = this.calculateSummary(debtItems as any[]);

    return {
      period,
      module,
      dateRange,
      income: {
        transactions: incomeItems,
        summary: incomeSummary,
      },
      outcome: {
        transactions: outcomeItems,
        summary: outcomeSummary,
      },
      debt: {
        transactions: debtItems,
        summary: debtSummary,
      },
    };
  }

  private calculateDateRange(
    period: ReportPeriod,
    specific_date?: Date,
    date_from?: Date,
    date_to?: Date,
  ): { from: Date; to: Date } {
    const now = new Date();
    let from: Date;
    let to: Date;

    switch (period) {
      case ReportPeriod.DAILY:
        const targetDate = specific_date || now;
        from = new Date(targetDate);
        from.setHours(0, 0, 0, 0);
        to = new Date(targetDate);
        to.setHours(23, 59, 59, 999);
        break;

      case ReportPeriod.WEEKLY:
        const weekStart = specific_date || now;
        from = new Date(weekStart);
        from.setDate(from.getDate() - from.getDay());
        from.setHours(0, 0, 0, 0);
        to = new Date(from);
        to.setDate(to.getDate() + 6);
        to.setHours(23, 59, 59, 999);
        break;

      case ReportPeriod.MONTHLY:
        const monthStart = specific_date || now;
        from = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1);
        from.setHours(0, 0, 0, 0);
        to = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
        to.setHours(23, 59, 59, 999);
        break;

      case ReportPeriod.YEARLY:
        const yearStart = specific_date || now;
        from = new Date(yearStart.getFullYear(), 0, 1);
        from.setHours(0, 0, 0, 0);
        to = new Date(yearStart.getFullYear(), 11, 31);
        to.setHours(23, 59, 59, 999);
        break;

      case ReportPeriod.CUSTOM:
        if (!date_from || !date_to) {
          throw new BadRequestException(
            'date_from and date_to are required for custom period',
          );
        }
        from = new Date(date_from);
        from.setHours(0, 0, 0, 0);
        to = new Date(date_to);
        to.setHours(23, 59, 59, 999);
        break;

      default:
        throw new BadRequestException('Invalid period type');
    }

    return { from, to };
  }

  private mapTransactionsToItems(
    transactions: ITransaction[],
  ): ReportTransactionItem[] {
    return transactions.map((transaction) => {
      const user = transaction.user as any;
      const ticket = transaction.ticket as any;
      const hotel = (transaction as any).hotelReservation;
      const hotelId = hotel?._id || hotel;

      const mappedTicket = ticket
        ? {
            _id: ticket._id.toString(),
            ticket_type: ticket.ticket_type,
            booking_reference: ticket.booking_reference,
            departure_location: ticket.departure_location,
            destination_location: ticket.destination_location,
            departure_date: ticket.departure_date,
            passengers: ticket.passengers,
            operator: ticket.operator,
            price: ticket.price,
            payment_status: ticket.payment_status,
            payment_chunks: ticket.payment_chunks || [],
          }
        : hotelId && typeof hotel !== 'string' && hotel.hotel_booking_id
          ? {
              _id: hotelId.toString(),
              ticket_type: TicketTypes.HOTEL,
              booking_reference: hotel.hotel_booking_id,
              departure_location: hotel.arrival_city || 'Hotel',
              destination_location: hotel.hotel_name,
              departure_date: hotel.check_in_date,
              passengers: hotel.travelers?.map((t: any) => ({
                first_name: t.full_name.split(' ')[0],
                last_name: t.full_name.split(' ').slice(1).join(' '),
              })),
              operator: hotel.operator,
              price: hotel.price,
              payment_status: hotel.payment_status,
              payment_chunks: hotel.payment_chunks || [],
            }
          : hotelId
            ? {
                _id: hotelId.toString(),
                ticket_type: TicketTypes.HOTEL,
                booking_reference: 'Rezervim Hoteli',
                departure_location: 'Hotel',
                destination_location: 'Detajet e hotelit',
                price: 0,
                payment_status: 'unknown',
                payment_chunks: [],
              }
            : undefined;

      return {
        _id: transaction._id.toString(),
        amount: transaction.amount,
        currency: transaction.currency,
        type: transaction.type,
        to: transaction.to,
        description: transaction.description,
        createdAt: transaction.createdAt,
        user: user
          ? {
              _id: user._id.toString(),
              email: user.email,
              first_name: user.first_name,
              last_name: user.last_name,
            }
          : undefined,
        ticket: mappedTicket,
      };
    });
  }

  private calculateSummary(transactions: ITransaction[]): CurrencySummary[] {
    const summaryMap = new Map<string, { total: number; count: number }>();

    transactions.forEach((transaction) => {
      const currency = transaction.currency || 'UNKNOWN';
      const existing = summaryMap.get(currency) || { total: 0, count: 0 };
      summaryMap.set(currency, {
        total: existing.total + transaction.amount,
        count: existing.count + 1,
      });
    });

    return Array.from(summaryMap.entries()).map(([currency, data]) => ({
      currency,
      total: Math.round(data.total * 100) / 100,
      count: data.count,
    }));
  }
}
