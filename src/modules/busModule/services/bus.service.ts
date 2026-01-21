import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ITicket, TicketTypes } from 'src/shared/types/ticket.types';
import {
  CreateBusTicketDto,
  UpdateBusTicketDto,
  AddLogDto,
  BusTicketQueryDto,
  CancelTicketDto,
} from 'src/shared/DTO/bus.dto';
import { PaymentStatusTypes } from 'src/shared/types/payment.types';
import {
  TransactionTypes,
  TransactionStatus,
} from 'src/shared/types/transaction.types';
import { TransactionServiceService } from 'src/transactions/transaction-service.service';

@Injectable()
export class BusService {
  constructor(
    @InjectModel('Ticket') private ticketModel: Model<ITicket>,
    private transactionService: TransactionServiceService,
  ) {}

  private generateBusUid(): string {
    // Generate random 5-6 digit number
    const numDigits = Math.random() < 0.5 ? 5 : 6;
    const min = Math.pow(10, numDigits - 1);
    const max = Math.pow(10, numDigits) - 1;
    const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
    return `B${randomNum}`;
  }

  async create(createBusTicketDto: CreateBusTicketDto): Promise<ITicket> {
    const ticketData = {
      ...createBusTicketDto,
      uid: this.generateBusUid(),
      ticket_type: TicketTypes.BUS,
      agency: createBusTicketDto.agency
        ? new Types.ObjectId(createBusTicketDto.agency)
        : undefined,
      employee: createBusTicketDto.employee
        ? new Types.ObjectId(createBusTicketDto.employee)
        : undefined,
    };

    const newTicket = new this.ticketModel(ticketData);
    const savedTicket = await newTicket.save();

    // Determine transaction type based on payment status
    const isUnpaid =
      createBusTicketDto.payment_status === PaymentStatusTypes.UNPAID;

    await this.transactionService.create({
      amount: createBusTicketDto.price,
      currency: createBusTicketDto.currency,
      type: isUnpaid ? TransactionTypes.DEBT : TransactionTypes.INCOME,
      status: isUnpaid ? TransactionStatus.PENDING : TransactionStatus.SETTLED,
      ticket: savedTicket._id.toString(),
      agency: createBusTicketDto.agency,
      user: createBusTicketDto.employee,
      description: isUnpaid
        ? 'Borxh - Biletë autobusi e papaguar'
        : 'Biletë autobusi',
    });

    return savedTicket;
  }

  async findAll(query: BusTicketQueryDto): Promise<{
    tickets: ITicket[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      departure_location,
      destination_location,
      departure_date_from,
      departure_date_to,
      payment_status,
      checked_in,
      operator,
      route_number,
      agency,
      page = 1,
      limit = 10,
    } = query;

    const filter: any = {
      ticket_type: TicketTypes.BUS,
      is_deleted: { $ne: true },
    };

    if (departure_location) {
      filter.departure_location = { $regex: departure_location, $options: 'i' };
    }

    if (destination_location) {
      filter.destination_location = {
        $regex: destination_location,
        $options: 'i',
      };
    }

    if (departure_date_from || departure_date_to) {
      filter.departure_date = {};
      if (departure_date_from) {
        filter.departure_date.$gte = departure_date_from;
      }
      if (departure_date_to) {
        filter.departure_date.$lte = departure_date_to;
      }
    }

    if (payment_status) {
      filter.payment_status = payment_status;
    }

    if (checked_in !== undefined) {
      filter.checked_in = checked_in;
    }

    if (operator) {
      filter.operator = { $regex: operator, $options: 'i' };
    }

    if (route_number) {
      filter.route_number = route_number;
    }

    if (agency) {
      filter.agency = new Types.ObjectId(agency);
    }

    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      this.ticketModel
        .find(filter)
        .populate('employee', 'email')
        .populate('agency')
        .sort({ departure_date: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.ticketModel.countDocuments(filter).exec(),
    ]);

    return {
      tickets,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<ITicket> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ticket ID');
    }

    const ticket = await this.ticketModel
      .findOne({
        _id: id,
        ticket_type: TicketTypes.BUS,
        is_deleted: { $ne: true },
      })
      .populate('employee', 'email')
      .populate('agency')
      .populate('logs.employee', 'email')
      .exec();

    if (!ticket) {
      throw new NotFoundException('Bus ticket not found');
    }

    return ticket;
  }

  async update(
    id: string,
    updateBusTicketDto: UpdateBusTicketDto,
  ): Promise<ITicket> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ticket ID');
    }

    // Get the current ticket to check payment status change
    const currentTicket = await this.ticketModel.findById(id).exec();
    if (!currentTicket) {
      throw new NotFoundException('Bus ticket not found');
    }

    const updateData: any = { ...updateBusTicketDto };

    if (updateBusTicketDto.agency) {
      updateData.agency = new Types.ObjectId(updateBusTicketDto.agency);
    }

    const ticket = await this.ticketModel
      .findOneAndUpdate(
        { _id: id, ticket_type: TicketTypes.BUS, is_deleted: { $ne: true } },
        { $set: updateData },
        { new: true },
      )
      .populate('employee', 'email')
      .populate('agency')
      .exec();

    if (!ticket) {
      throw new NotFoundException('Bus ticket not found');
    }

    // Handle payment status change - update transaction
    if (
      updateBusTicketDto.payment_status &&
      updateBusTicketDto.payment_status !== currentTicket.payment_status
    ) {
      const isPaidNow =
        updateBusTicketDto.payment_status === PaymentStatusTypes.PAID;
      const wasUnpaid =
        currentTicket.payment_status === PaymentStatusTypes.UNPAID;

      if (isPaidNow && wasUnpaid) {
        // Debt is being settled - convert to income
        await this.transactionService.settleDebt(id);
      } else if (
        updateBusTicketDto.payment_status === PaymentStatusTypes.UNPAID
      ) {
        // Changing to unpaid - update transaction to debt
        await this.transactionService.updateByTicket(id, {
          type: TransactionTypes.DEBT,
          status: TransactionStatus.PENDING,
          description: 'Borxh - Biletë autobusi e papaguar',
        });
      }
    }

    return ticket;
  }

  async delete(id: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ticket ID');
    }

    const result = await this.ticketModel.findByIdAndUpdate(
      id,
      { is_deleted: true },
      { new: true },
    );

    if (!result) {
      throw new NotFoundException('Bus ticket not found');
    }

    return { message: 'Bus ticket deleted successfully' };
  }

  async addLog(id: string, addLogDto: AddLogDto): Promise<ITicket> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ticket ID');
    }

    const logEntry = {
      ...addLogDto,
      employee: addLogDto.employee
        ? new Types.ObjectId(addLogDto.employee)
        : undefined,
      created_at: new Date(),
    };

    const ticket = await this.ticketModel
      .findOneAndUpdate(
        { _id: id, ticket_type: TicketTypes.BUS, is_deleted: { $ne: true } },
        { $push: { logs: logEntry } },
        { new: true },
      )
      .populate('employee', 'email')
      .populate('agency')
      .populate('logs.employee', 'email')
      .exec();

    if (!ticket) {
      throw new NotFoundException('Bus ticket not found');
    }

    return ticket;
  }

  async updatePaymentStatus(
    id: string,
    paymentStatus: PaymentStatusTypes,
  ): Promise<ITicket> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ticket ID');
    }

    const ticket = await this.ticketModel
      .findOneAndUpdate(
        { _id: id, ticket_type: TicketTypes.BUS, is_deleted: { $ne: true } },
        { $set: { payment_status: paymentStatus } },
        { new: true },
      )
      .populate('employee', 'email')
      .populate('agency')
      .exec();

    if (!ticket) {
      throw new NotFoundException('Bus ticket not found');
    }

    return ticket;
  }

  async checkIn(id: string, checkedIn: boolean): Promise<ITicket> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ticket ID');
    }

    const ticket = await this.ticketModel
      .findOneAndUpdate(
        { _id: id, ticket_type: TicketTypes.BUS, is_deleted: { $ne: true } },
        { $set: { checked_in: checkedIn } },
        { new: true },
      )
      .populate('employee', 'email')
      .populate('agency')
      .exec();

    if (!ticket) {
      throw new NotFoundException('Bus ticket not found');
    }

    return ticket;
  }

  async findByBookingReference(bookingReference: string): Promise<ITicket> {
    const ticket = await this.ticketModel
      .findOne({
        $or: [
          { booking_reference: bookingReference },
          { original_booking_reference: bookingReference },
        ],
        ticket_type: TicketTypes.BUS,
        is_deleted: { $ne: true },
      })
      .populate('employee', 'email')
      .populate('agency')
      .exec();

    if (!ticket) {
      throw new NotFoundException('Bus ticket not found');
    }

    return ticket;
  }

  async cancel(id: string, cancelTicketDto: CancelTicketDto): Promise<ITicket> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ticket ID');
    }

    const ticket = await this.ticketModel.findById(id).exec();
    if (!ticket) {
      throw new NotFoundException('Bus ticket not found');
    }

    if (ticket.status === 'canceled') {
      throw new BadRequestException('Bileta është e anuluar tashmë');
    }

    const { refund_chunks, note } = cancelTicketDto;

    // 1. Update ticket status
    ticket.status = 'canceled';
    if (note) {
      ticket.note = ticket.note
        ? `${ticket.note}\n\nAnulimi: ${note}`
        : `Anulimi: ${note}`;
    }

    // 2. Handle transactions
    const wasUnpaid =
      ticket.payment_status === PaymentStatusTypes.UNPAID ||
      ticket.payment_status === PaymentStatusTypes.NOT_PAID;

    if (wasUnpaid) {
      // If it's unpaid, we just delete the debt transaction
      await this.transactionService.deleteByTicket(id);
    } else {
      // If it was paid or partially paid, handle refunds if provided
      if (refund_chunks && refund_chunks.length > 0) {
        if (!ticket.payment_chunks) {
          ticket.payment_chunks = [];
        }
        for (const chunk of refund_chunks) {
          ticket.payment_chunks.push({
            amount: -Math.abs(chunk.amount),
            currency: chunk.currency,
            payment_date: new Date(),
          });

          await this.transactionService.create({
            amount: Math.abs(chunk.amount),
            currency: chunk.currency,
            type: TransactionTypes.OUTCOME,
            status: TransactionStatus.SETTLED,
            ticket: ticket._id.toString(),
            agency: ticket.agency?.toString() || '',
            user: ticket.employee?.toString(),
            description: `Rimbursim - Biletë autobusi e anuluar (${ticket.uid})`,
          });
        }
        ticket.payment_status = PaymentStatusTypes.REFUNDED;
      }
    }

    return await ticket.save();
  }
}
