import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ITicket, TicketTypes } from 'src/shared/types/ticket.types';
import {
  CreatePlaneTicketDto,
  UpdatePlaneTicketDto,
  AddPlaneLogDto,
  PlaneTicketQueryDto,
  CancelTicketDto,
} from 'src/shared/DTO/plane.dto';
import { PaymentStatusTypes } from 'src/shared/types/payment.types';
import {
  TransactionTypes,
  TransactionStatus,
} from 'src/shared/types/transaction.types';
import { TransactionServiceService } from 'src/transactions/transaction-service.service';

@Injectable()
export class PlaneService {
  constructor(
    @InjectModel('Ticket') private ticketModel: Model<ITicket>,
    private transactionService: TransactionServiceService,
  ) { }

  private generatePlaneUid(): string {
    // Generate random 5-6 digit number
    const numDigits = Math.random() < 0.5 ? 5 : 6;
    const min = Math.pow(10, numDigits - 1);
    const max = Math.pow(10, numDigits) - 1;
    const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
    return `A${randomNum}`;
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
      neto_price: 'Çmimi Neto',
      currency: 'Valuta',
      payment_status: 'Statusi i pagesës',
      departure_date: 'Data e nisjes',
      arrival_date: 'Data e mbërritjes',
      return_date: 'Data e kthimit',
      return_arrival_date: 'Data e mbërritjes (kthim)',
      departure_location: 'Vendi i nisjes',
      destination_location: 'Destinacioni',
      operator: 'Kompania ajrore',
      route_number: 'Nr. i fluturimit',
      booking_reference: 'Ref. i rezervimit',
      note: 'Shënim',
      checked_in: 'Check-in',
    };

    for (const key in newData) {
      if (['logs', '_id', '__v', 'employee', 'updatedAt', 'createdAt', 'passengers', 'payment_chunks', 'is_round_trip'].includes(key)) continue;

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

  async create(createPlaneTicketDto: CreatePlaneTicketDto): Promise<ITicket> {
    if (
      !createPlaneTicketDto.agency ||
      !Types.ObjectId.isValid(createPlaneTicketDto.agency)
    ) {
      console.error(
        'ERROR: Attempted to create ticket without valid Agency ID, received:',
        createPlaneTicketDto.agency,
      );
      throw new BadRequestException(
        'A valid Agency ID is required to create a ticket',
      );
    }

    const ticketData = {
      ...createPlaneTicketDto,
      uid: this.generatePlaneUid(),
      ticket_type: TicketTypes.PLANE,
      agency: new Types.ObjectId(createPlaneTicketDto.agency),
      employee:
        createPlaneTicketDto.employee &&
          Types.ObjectId.isValid(createPlaneTicketDto.employee)
          ? new Types.ObjectId(createPlaneTicketDto.employee)
          : undefined,
      logs: [
        {
          title: 'U krijua bileta',
          description: `Bileta u krijua me sukses nga ${createPlaneTicketDto.operator || 'operatori'}.`,
          employee:
            createPlaneTicketDto.employee &&
              Types.ObjectId.isValid(createPlaneTicketDto.employee)
              ? new Types.ObjectId(createPlaneTicketDto.employee)
              : undefined,
          created_at: new Date(),
        },
      ],
    };

    console.log('Saving Ticket Data:', JSON.stringify(ticketData, null, 2));

    const newTicket = new this.ticketModel(ticketData);
    const savedTicket = await newTicket.save();

    console.log('Saved Ticket Result:', savedTicket);

    // Determine transaction type based on payment status
    const isUnpaid =
      createPlaneTicketDto.payment_status === PaymentStatusTypes.UNPAID ||
      createPlaneTicketDto.payment_status === PaymentStatusTypes.NOT_PAID;

    try {
      await this.transactionService.create({
        amount: createPlaneTicketDto.price,
        currency: createPlaneTicketDto.currency,
        type: isUnpaid ? TransactionTypes.DEBT : TransactionTypes.INCOME,
        status: isUnpaid
          ? TransactionStatus.PENDING
          : TransactionStatus.SETTLED,
        ticket: savedTicket._id.toString(),
        agency: createPlaneTicketDto.agency,
        user: createPlaneTicketDto.employee,
        description: isUnpaid
          ? 'Borxh - Biletë avioni e papaguar'
          : 'Biletë avioni',
      });
    } catch (txError) {
      console.error('Transaction creation failed:', txError);
      // We do not revert the ticket creation, but we should probably log this.
    }

    return savedTicket;
  }

  async findAll(query: PlaneTicketQueryDto): Promise<{
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
      page = 1,
      limit = 10,
      agency,
    } = query;

    const filter: any = {
      ticket_type: TicketTypes.PLANE,
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
    console.log(tickets);
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
        ticket_type: TicketTypes.PLANE,
        is_deleted: { $ne: true },
      })
      .populate('employee', 'email')
      .populate('agency')
      .populate('logs.employee', 'email')
      .exec();

    if (!ticket) {
      throw new NotFoundException('Plane ticket not found');
    }

    return ticket;
  }

  async update(
    id: string,
    updatePlaneTicketDto: UpdatePlaneTicketDto,
  ): Promise<ITicket> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ticket ID');
    }

    // Get the current ticket to check payment status change
    const currentTicket = await this.ticketModel.findById(id).exec();
    if (!currentTicket) {
      throw new NotFoundException('Plane ticket not found');
    }

    const updateData: any = { ...updatePlaneTicketDto };

    if (updatePlaneTicketDto.agency) {
      updateData.agency = new Types.ObjectId(updatePlaneTicketDto.agency);
    }

    const ticket = await this.ticketModel
      .findOneAndUpdate(
        { _id: id, ticket_type: TicketTypes.PLANE, is_deleted: { $ne: true } },
        { $set: updateData },
        { new: true },
      )
      .populate('employee', 'email')
      .populate('agency')
      .exec();

    if (!ticket) {
      throw new NotFoundException('Plane ticket not found');
    }

    const changesDescription = this.getChangesDescription(currentTicket.toObject(), updateData);

    await this.addLogInternal(
      id,
      'Ndryshim i të dhënave',
      changesDescription,
      updatePlaneTicketDto.employee,
    );

    // Handle payment status change - update transaction
    if (
      updatePlaneTicketDto.payment_status &&
      updatePlaneTicketDto.payment_status !== currentTicket.payment_status
    ) {
      const isPaidNow =
        updatePlaneTicketDto.payment_status === PaymentStatusTypes.PAID;
      const wasUnpaid =
        currentTicket.payment_status === PaymentStatusTypes.UNPAID ||
        currentTicket.payment_status === PaymentStatusTypes.NOT_PAID;

      if (isPaidNow && wasUnpaid) {
        // Debt is being settled - convert to income
        await this.transactionService.settleDebt(id);
      } else if (
        updatePlaneTicketDto.payment_status === PaymentStatusTypes.UNPAID ||
        updatePlaneTicketDto.payment_status === PaymentStatusTypes.NOT_PAID
      ) {
        // Changing to unpaid - update transaction to debt
        await this.transactionService.updateByTicket(id, {
          type: TransactionTypes.DEBT,
          status: TransactionStatus.PENDING,
          description: 'Borxh - Biletë avioni e papaguar',
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
      throw new NotFoundException('Plane ticket not found');
    }

    await this.addLogInternal(
      id,
      'Bileta u fshi',
      'Bileta u shënua si e fshirë.',
      employeeId,
    );

    return { message: 'Plane ticket deleted successfully' };
  }

  async addLog(id: string, addLogDto: AddPlaneLogDto): Promise<ITicket> {
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
        { _id: id, ticket_type: TicketTypes.PLANE, is_deleted: { $ne: true } },
        { $push: { logs: logEntry } },
        { new: true },
      )
      .populate('employee', 'email')
      .populate('agency')
      .populate('logs.employee', 'email')
      .exec();

    if (!ticket) {
      throw new NotFoundException('Plane ticket not found');
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
        { _id: id, ticket_type: TicketTypes.PLANE, is_deleted: { $ne: true } },
        { $set: { payment_status: paymentStatus } },
        { new: true },
      )
      .populate('employee', 'email')
      .populate('agency')
      .exec();

    if (!ticket) {
      throw new NotFoundException('Plane ticket not found');
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
        { _id: id, ticket_type: TicketTypes.PLANE, is_deleted: { $ne: true } },
        { $set: { checked_in: checkedIn } },
        { new: true },
      )
      .populate('employee', 'email')
      .populate('agency')
      .exec();

    if (!ticket) {
      throw new NotFoundException('Plane ticket not found');
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
        ticket_type: TicketTypes.PLANE,
        is_deleted: { $ne: true },
      })
      .populate('employee', 'email')
      .populate('agency')
      .exec();

    if (!ticket) {
      throw new NotFoundException('Plane ticket not found');
    }

    return ticket;
  }

  async cancel(id: string, cancelTicketDto: CancelTicketDto): Promise<ITicket> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ticket ID');
    }

    const ticket = await this.ticketModel.findById(id).exec();
    if (!ticket) {
      throw new NotFoundException('Plane ticket not found');
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
        // Add refund chunks to payment_chunks
        // We might want to mark these as refunds (negative amount?)
        // The user suggested using payment chunks for refunds
        for (const chunk of refund_chunks) {
          ticket.payment_chunks.push({
            amount: -Math.abs(chunk.amount), // Ensure it's negative to represent a refund
            currency: chunk.currency,
            payment_date: new Date(),
          });

          // Create an OUTCOME transaction for each refund
          await this.transactionService.create({
            amount: Math.abs(chunk.amount),
            currency: chunk.currency,
            type: TransactionTypes.OUTCOME,
            status: TransactionStatus.SETTLED,
            ticket: ticket._id.toString(),
            agency: ticket.agency?.toString() || '',
            user: ticket.employee?.toString(),
            description: `Rimbursim - Biletë avioni e anuluar (${ticket.uid})`,
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
      throw new NotFoundException('Plane ticket not found');
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
        agency: ticket.agency?.toString() || '',
        user: ticket.employee?.toString(),
        description: `Rimbursim - Biletë avioni e anuluar (${ticket.uid})`,
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
