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
  ) { }

  private generateBusUid(): string {
    // Generate random 5-6 digit number
    const numDigits = Math.random() < 0.5 ? 5 : 6;
    const min = Math.pow(10, numDigits - 1);
    const max = Math.pow(10, numDigits) - 1;
    const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
    return `B${randomNum}`;
  }

  private async addLogInternal(
    ticketId: string,
    title: string,
    description: string,
    employeeId?: string,
  ) {
    const logEntry = {
      title,
      description,
      employee: employeeId ? new Types.ObjectId(employeeId) : undefined,
      created_at: new Date(),
    };

    await this.ticketModel.updateOne(
      { _id: ticketId },
      { $push: { logs: logEntry } },
    );
  }

  private getChangesDescription(oldData: any, newData: any): string {
    const changes: string[] = [];
    const fieldNames: Record<string, string> = {
      price: 'Çmimi',
      currency: 'Valuta',
      payment_status: 'Statusi i pagesës',
      departure_date: 'Data e nisjes',
      arrival_date: 'Data e mbërritjes',
      return_date: 'Data e kthimit',
      departure_location: 'Vendi i nisjes',
      destination_location: 'Destinacioni',
      operator: 'Operatori',
      route_number: 'Nr. i linjës',
      note: 'Shënim',
      checked_in: 'Check-in',
      booking_reference: 'Ref. i rezervimit',
    };

    for (const key in newData) {
      if (['logs', '_id', '__v', 'employee', 'updatedAt', 'createdAt', 'passengers', 'payment_chunks'].includes(key)) continue;

      let oldValue = oldData[key];
      let newValue = newData[key];

      // Skip if value is not provided in update
      if (newValue === undefined) continue;

      // Handle dates
      if (key.includes('date') || key.includes('arrival')) {
        const oldTime = oldValue ? new Date(oldValue).getTime() : 0;
        const newTime = newValue ? new Date(newValue).getTime() : 0;

        if (oldTime !== newTime) {
          const oldStr = oldValue ? new Date(oldValue).toLocaleString('sq-AL') : 'pa përcaktuar';
          const newStr = newValue ? new Date(newValue).toLocaleString('sq-AL') : 'pa përcaktuar';
          changes.push(`${fieldNames[key] || key}: ${oldStr} -> ${newStr}`);
        }
        continue;
      }

      if (oldValue !== newValue) {
        changes.push(`${fieldNames[key] || key}: ${oldValue || 'pa përcaktuar'} -> ${newValue}`);
      }
    }

    if (newData.payment_chunks && JSON.stringify(oldData.payment_chunks) !== JSON.stringify(newData.payment_chunks)) {
      const oldLen = oldData.payment_chunks?.length || 0;
      const newLen = newData.payment_chunks?.length || 0;
      if (newLen > oldLen) {
        const latest = newData.payment_chunks[newLen - 1];
        changes.push(`U shtua pagesa: ${latest.amount} ${latest.currency}`);
      } else {
        changes.push('Llogaritë e pagesave u përditësuan');
      }
    }

    if (newData.passengers && JSON.stringify(oldData.passengers) !== JSON.stringify(newData.passengers)) {
      changes.push('Të dhënat e pasagjerëve u përditësuan');
    }

    return changes.length > 0 ? changes.join(', ') : 'Të dhënat u përditësuan.';
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
      logs: [
        {
          title: 'U krijua bileta',
          description: `Bileta u krijua me sukses nga ${createBusTicketDto.operator || 'operatori'}.`,
          employee: createBusTicketDto.employee
            ? new Types.ObjectId(createBusTicketDto.employee)
            : undefined,
          created_at: new Date(),
        },
      ],
    };

    const newTicket = new this.ticketModel(ticketData);
    const savedTicket = await newTicket.save();

    // Handle transactions based on payment chunks
    const paymentChunks = createBusTicketDto.payment_chunks || [];
    const hasPaymentChunks = paymentChunks.length > 0;

    if (hasPaymentChunks) {
      // Create INCOME transactions for each payment chunk
      for (const chunk of paymentChunks) {
        await this.transactionService.create({
          amount: chunk.amount,
          currency: chunk.currency,
          type: TransactionTypes.INCOME,
          status: TransactionStatus.SETTLED,
          ticket: savedTicket._id.toString(),
          agency: createBusTicketDto.agency,
          user: createBusTicketDto.employee,
          description: `Pagesë - Biletë autobusi (${savedTicket.uid})`,
        });
      }
    } else if (createBusTicketDto.payment_status === PaymentStatusTypes.PAID) {
      // Fully paid without chunks - create single INCOME transaction
      await this.transactionService.create({
        amount: createBusTicketDto.price,
        currency: createBusTicketDto.currency,
        type: TransactionTypes.INCOME,
        status: TransactionStatus.SETTLED,
        ticket: savedTicket._id.toString(),
        agency: createBusTicketDto.agency,
        user: createBusTicketDto.employee,
        description: 'Biletë autobusi',
      });
    } else if (createBusTicketDto.payment_status === PaymentStatusTypes.UNPAID) {
      // Unpaid - create DEBT transaction
      await this.transactionService.create({
        amount: createBusTicketDto.price,
        currency: createBusTicketDto.currency,
        type: TransactionTypes.DEBT,
        status: TransactionStatus.PENDING,
        ticket: savedTicket._id.toString(),
        agency: createBusTicketDto.agency,
        user: createBusTicketDto.employee,
        description: 'Borxh - Biletë autobusi e papaguar',
      });
    }

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
        .populate('documentId')
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
      .populate('documentId')
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

    // Detect new payment chunks before updating
    const oldPaymentChunks = currentTicket.payment_chunks || [];
    const newPaymentChunks = updateBusTicketDto.payment_chunks || [];
    const newChunksAdded = newPaymentChunks.length > oldPaymentChunks.length
      ? newPaymentChunks.slice(oldPaymentChunks.length)
      : [];

    const ticket = await this.ticketModel
      .findOneAndUpdate(
        { _id: id, ticket_type: TicketTypes.BUS, is_deleted: { $ne: true } },
        { $set: updateData },
        { new: true },
      )
      .populate('employee', 'email')
      .populate('agency')
      .populate('documentId')
      .exec();

    if (!ticket) {
      throw new NotFoundException('Bus ticket not found');
    }

    const changesDescription = this.getChangesDescription(currentTicket.toObject(), updateData);

    await this.addLogInternal(
      id,
      'Ndryshim i të dhënave',
      changesDescription,
      updateBusTicketDto.employee,
    );

    // Create INCOME transactions for each new payment chunk
    for (const chunk of newChunksAdded) {
      await this.transactionService.create({
        amount: chunk.amount,
        currency: chunk.currency,
        type: TransactionTypes.INCOME,
        status: TransactionStatus.SETTLED,
        ticket: id,
        agency: ticket.agency instanceof Types.ObjectId
          ? ticket.agency.toString()
          : (ticket.agency as any)?._id?.toString() || updateBusTicketDto.agency,
        user: updateBusTicketDto.employee,
        description: `Pagesë - Biletë autobusi (${ticket.uid})`,
      });
    }

    // Handle payment status change - update transaction (only for non-partial payments)
    if (
      updateBusTicketDto.payment_status &&
      updateBusTicketDto.payment_status !== currentTicket.payment_status &&
      newChunksAdded.length === 0 // Only handle if not adding payment chunks
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

  async delete(id: string, employeeId?: string): Promise<{ message: string }> {
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

    await this.addLogInternal(
      id,
      'Bileta u fshi',
      'Bileta u shënua si e fshirë.',
      employeeId,
    );

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
    employeeId?: string,
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

    await this.addLogInternal(
      id,
      'Ndryshim i statusit të pagesës',
      `Statusi i pagesës u ndryshua në: ${paymentStatus}`,
      employeeId,
    );

    return ticket;
  }

  async checkIn(
    id: string,
    checkedIn: boolean,
    employeeId?: string,
  ): Promise<ITicket> {
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

    await this.addLogInternal(
      id,
      checkedIn ? 'Check-in i kryer' : 'Check-in i anuluar',
      checkedIn
        ? 'Pasagjeri bëri check-in me sukses.'
        : 'Anulimi i statusit check-in.',
      employeeId,
    );

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
            agency: ticket.agency instanceof Types.ObjectId
              ? ticket.agency.toString()
              : (ticket.agency as any)?._id?.toString() || '',
            user: ticket.employee?.toString(),
            description: `Rimbursim - Biletë autobusi e anuluar (${ticket.uid})`,
          });
        }
        ticket.payment_status = PaymentStatusTypes.REFUNDED;
      }
    }

    const refundInfo = refund_chunks && refund_chunks.length > 0
      ? `Rimbursim: ${refund_chunks.map(c => `${c.amount} ${c.currency}`).join(', ')}.`
      : 'Pa rimbursim.';

    await this.addLogInternal(
      id,
      'Bileta u anulua',
      `Bileta u anulua. ${refundInfo} Arsyetimi: ${note || '-'}`,
      cancelTicketDto.employee,
    );

    return await ticket.save();
  }

  async refund(id: string, refundDto: CancelTicketDto): Promise<ITicket> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ticket ID');
    }

    const ticket = await this.ticketModel.findById(id).exec();
    if (!ticket) {
      throw new NotFoundException('Bus ticket not found');
    }

    if (ticket.status !== 'canceled') {
      throw new BadRequestException('Vetëm biletat e anuluara mund të rimbursohen');
    }

    if (ticket.payment_status === PaymentStatusTypes.REFUNDED) {
      throw new BadRequestException('Bileta është rimbursuar tashmë');
    }

    const { refund_chunks, note } = refundDto;

    if (!refund_chunks || refund_chunks.length === 0) {
      throw new BadRequestException('Duhet të shtoni së paku një rimbursim');
    }

    // Add refund chunks and create transactions
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
        agency: ticket.agency instanceof Types.ObjectId
          ? ticket.agency.toString()
          : (ticket.agency as any)?._id?.toString() || '',
        user: ticket.employee?.toString(),
        description: `Rimbursim - Biletë autobusi e anuluar (${ticket.uid})`,
      });
    }

    ticket.payment_status = PaymentStatusTypes.REFUNDED;

    if (note) {
      ticket.note = ticket.note
        ? `${ticket.note}\n\nRimbursimi: ${note}`
        : `Rimbursimi: ${note}`;
    }

    const refundInfo = `Rimbursim: ${refund_chunks.map(c => `${c.amount} ${c.currency}`).join(', ')}.`;

    await this.addLogInternal(
      id,
      'Bileta u rimbursua',
      `${refundInfo} Shënim: ${note || '-'}`,
      refundDto.employee,
    );

    return await ticket.save();
  }
}
