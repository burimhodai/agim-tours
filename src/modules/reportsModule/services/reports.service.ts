import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ITransaction, TransactionTypes } from 'src/shared/types/transaction.types';
import { ReportQueryDto, ReportResponseDto, ReportPeriod, CurrencySummary, ReportTransactionItem } from 'src/shared/DTO/report.dto';
import { PaymentStatusTypes } from 'src/shared/types/payment.types';

@Injectable()
export class ReportsService {
    constructor(
        @InjectModel('Transaction') private transactionModel: Model<ITransaction>,
    ) { }

    async generateReport(query: ReportQueryDto): Promise<ReportResponseDto> {
        const { period, module, agency, employee, date_from, date_to, specific_date } = query;

        const dateRange = this.calculateDateRange(period, specific_date, date_from, date_to);

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
            .sort({ createdAt: -1 })
            .exec();

        if (module) {
            allTransactions = allTransactions.filter(transaction => {
                const ticket = transaction.ticket as any;
                return ticket && ticket.ticket_type === module;
            });
        }

        allTransactions = allTransactions.filter(transaction => {
            const ticket = transaction.ticket as any;
            return ticket && ticket.payment_status === PaymentStatusTypes.PAID;
        });

        const incomeTransactions = allTransactions.filter(t => t.type === TransactionTypes.INCOME);
        const outcomeTransactions = allTransactions.filter(t => t.type === TransactionTypes.OUTCOME);

        const incomeItems = this.mapTransactionsToItems(incomeTransactions);
        const outcomeItems = this.mapTransactionsToItems(outcomeTransactions);

        const incomeSummary = this.calculateSummary(incomeTransactions);
        const outcomeSummary = this.calculateSummary(outcomeTransactions);

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
                    throw new BadRequestException('date_from and date_to are required for custom period');
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

    private mapTransactionsToItems(transactions: ITransaction[]): ReportTransactionItem[] {
        return transactions.map(transaction => {
            const user = transaction.user as any;
            const ticket = transaction.ticket as any;

            return {
                _id: transaction._id.toString(),
                amount: transaction.amount,
                currency: transaction.currency,
                type: transaction.type,
                to: transaction.to,
                description: transaction.description,
                createdAt: transaction.createdAt,
                user: user ? {
                    _id: user._id.toString(),
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                } : undefined,
                ticket: ticket ? {
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
                } : undefined,
            };
        });
    }

    private calculateSummary(transactions: ITransaction[]): CurrencySummary[] {
        const summaryMap = new Map<string, { total: number; count: number }>();

        transactions.forEach(transaction => {
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
