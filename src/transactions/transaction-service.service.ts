import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ITransaction } from 'src/shared/types/transaction.types';
import { CreateTransactionDto, TransactionQueryDto } from 'src/shared/DTO/transaction.dto';

@Injectable()
export class TransactionServiceService {
    constructor(
        @InjectModel('Transaction') private transactionModel: Model<ITransaction>,
    ) { }

    async create(createTransactionDto: CreateTransactionDto): Promise<ITransaction> {
        const transactionData = {
            ...createTransactionDto,
            agency: createTransactionDto.agency
                ? new Types.ObjectId(createTransactionDto.agency)
                : undefined,
            user: createTransactionDto.user
                ? new Types.ObjectId(createTransactionDto.user)
                : undefined,
            ticket: createTransactionDto.ticket
                ? new Types.ObjectId(createTransactionDto.ticket)
                : undefined,
        };

        const newTransaction = new this.transactionModel(transactionData);
        return await newTransaction.save();
    }

    async findAll(query: TransactionQueryDto): Promise<ITransaction[]> {
        const { date, date_from, date_to, type, agency, user } = query;

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
}
