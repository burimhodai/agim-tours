import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ITicket, TicketTypes } from 'src/shared/types/ticket.types';
import { IUser } from 'src/shared/types/user.types';
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
import { MailService } from '../../mailModule/services/mail.service';

@Injectable()
export class PlaneService {
  constructor(
    @InjectModel('Ticket') private ticketModel: Model<ITicket>,
    @InjectModel('User') private userModel: Model<IUser>,
    private transactionService: TransactionServiceService,
    private mailService: MailService,
  ) { }

  private generatePlaneUid(): string {
    const numDigits = Math.random() < 0.5 ? 5 : 6;
    const min = Math.pow(10, numDigits - 1);
    const max = Math.pow(10, numDigits) - 1;
    const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
    return `A${randomNum}`;
  }

  private async getEmployeeAgencyId(employeeId?: string): Promise<string> {
    if (!employeeId || !Types.ObjectId.isValid(employeeId)) return '';
    const employee = await this.userModel.findById(employeeId).exec();
    return employee?.agency?.toString() || '';
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
      return_checked_in: 'Return Check-in',
    };

    for (const key in newData) {
      if (['logs', '_id', '__v', 'employee', 'updatedAt', 'createdAt', 'passengers', 'payment_chunks', 'is_round_trip', 'stops', 'return_stops'].includes(key)) continue;

      let oldValue = oldData[key];
      let newValue = newData[key];

      if (newValue === undefined) continue;

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

    if ((newData.stops && JSON.stringify(oldData.stops) !== JSON.stringify(newData.stops)) ||
      (newData.return_stops && JSON.stringify(oldData.return_stops) !== JSON.stringify(newData.return_stops))) {
      changes.push('Ndalesat u përditësuan');
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

    const newTicket = new this.ticketModel(ticketData);
    const savedTicket = await newTicket.save();

    const employeeId =
      createPlaneTicketDto.employee || savedTicket.employee?.toString() || '';
    const agencyId = await this.getEmployeeAgencyId(employeeId);
    const ticketCurrency = createPlaneTicketDto.currency || 'euro';

    try {
      await this.transactionService.create({
        amount: createPlaneTicketDto.price,
        currency: ticketCurrency as any,
        type: TransactionTypes.DEBT,
        status: TransactionStatus.PENDING,
        ticket: savedTicket._id.toString(),
        agency: agencyId,
        user: employeeId,
        description: `Borxh - Biletë avioni e papaguar (${savedTicket.uid})`,
      });

      const paymentChunks = createPlaneTicketDto.payment_chunks || [];
      if (paymentChunks.length > 0) {
        for (const chunk of paymentChunks) {
          await this.transactionService.create({
            amount: chunk.amount,
            currency: chunk.currency,
            type: TransactionTypes.INCOME,
            status: TransactionStatus.SETTLED,
            ticket: savedTicket._id.toString(),
            agency: agencyId,
            user: employeeId,
            description: `Pagesë - Biletë avioni (${savedTicket.uid})`,
          });

          await this.transactionService.reduceDebtByTicket(
            savedTicket._id.toString(),
            chunk.amount,
            chunk.currency,
            agencyId,
            employeeId,
          );
        }
      } else if (
        createPlaneTicketDto.payment_status === PaymentStatusTypes.PAID
      ) {
        const debtTx = await this.transactionService.findByTicketDebt(
          savedTicket._id.toString(),
        );
        if (debtTx) {
          debtTx.type = TransactionTypes.INCOME;
          debtTx.status = TransactionStatus.SETTLED;
          debtTx.description = (debtTx.description || '')
            .replace('Borxh - ', '')
            .replace(' e papaguar', ' - Paguar plotësisht');
          await debtTx.save();
        }
      }
    } catch (txError) { }

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

    const andConditions: any[] = [
      {
        $or: [
          { ticket_type: { $regex: new RegExp(`^${TicketTypes.PLANE}$`, 'i') } },
          { ticket_type: { $exists: false } },
          { ticket_type: null },
          { ticket_type: "" }
        ]
      }
    ];

    if (agency && Types.ObjectId.isValid(agency)) {
      andConditions.push({
        $or: [
          { agency: new Types.ObjectId(agency) },
          { agency: { $exists: false } },
          { agency: null }
        ]
      });
    }

    const filter: any = {
      is_deleted: { $ne: true },
      $and: andConditions
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

    if (query.operatorId) {
      filter.operatorId = query.operatorId;
    }

    if (route_number) {
      filter.route_number = route_number;
    }

    console.log('Plane Ticket Filter:', JSON.stringify(filter));

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
        ticket_type: TicketTypes.PLANE,
        is_deleted: { $ne: true },
      })
      .populate('employee', 'email')
      .populate('agency')
      .populate('documentId')
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

    const currentTicket = await this.ticketModel.findById(id).exec();
    if (!currentTicket) {
      throw new NotFoundException('Plane ticket not found');
    }

    const updateData: any = { ...updatePlaneTicketDto };

    const oldPrice = currentTicket.price;
    const newPrice =
      updatePlaneTicketDto.price !== undefined
        ? updatePlaneTicketDto.price
        : oldPrice;
    const priceChanged =
      updatePlaneTicketDto.price !== undefined && oldPrice !== newPrice;

    const allChunks = updatePlaneTicketDto.payment_chunks || currentTicket.payment_chunks || [];
    const hasAnyPayments = allChunks.length > 0;

    if (priceChanged) {
      if (hasAnyPayments) {
        updateData.payment_status = PaymentStatusTypes.PARTIALLY_PAID;
      } else {
        updateData.payment_status = PaymentStatusTypes.UNPAID;
      }
    }

    const ticket = await this.ticketModel
      .findOneAndUpdate(
        { _id: id, ticket_type: TicketTypes.PLANE, is_deleted: { $ne: true } },
        { $set: updateData },
        { new: true },
      )
      .populate('employee', 'email')
      .populate('agency')
      .populate('documentId')
      .exec();

    if (!ticket) {
      throw new NotFoundException('Plane ticket not found');
    }

    const employeeId =
      updatePlaneTicketDto.employee ||
      currentTicket.employee?.toString() ||
      '';
    const agencyId = await this.getEmployeeAgencyId(employeeId);
    const ticketCurrency =
      updatePlaneTicketDto.currency || currentTicket.currency || 'euro';

    const changesDescription = this.getChangesDescription(
      currentTicket.toObject(),
      updateData,
    );

    await this.addLogInternal(
      id,
      'Ndryshim i të dhënave',
      changesDescription,
      updatePlaneTicketDto.employee,
    );

    const oldChunksSimplified = (currentTicket.payment_chunks || []).map(c => ({
      amount: c.amount,
      currency: c.currency
    }));
    const newChunksSimplified = (updatePlaneTicketDto.payment_chunks || []).map(c => ({
      amount: c.amount,
      currency: c.currency
    }));

    const chunksChanged = updatePlaneTicketDto.payment_chunks !== undefined &&
      JSON.stringify(oldChunksSimplified) !== JSON.stringify(newChunksSimplified);

    if (priceChanged || chunksChanged) {
      const finalChunks = ticket.payment_chunks || [];
      const oldChunkCount = (currentTicket.payment_chunks || []).length;
      const newlyAddedChunks = finalChunks.slice(oldChunkCount);

      for (const chunk of newlyAddedChunks) {
        if (chunk.amount > 0) {
          await this.transactionService.create({
            amount: chunk.amount,
            currency: chunk.currency,
            type: TransactionTypes.INCOME,
            status: TransactionStatus.SETTLED,
            ticket: id,
            agency: agencyId,
            user: employeeId,
            description: `Pagesë - Biletë avioni (${ticket.uid})`,
          });
        }
      }

      let totalPaidInTicketCurrency = 0;
      for (const chunk of finalChunks) {
        if (chunk.amount <= 0) continue;
        if (
          chunk.currency &&
          chunk.currency.toLowerCase() !== ticketCurrency.toLowerCase()
        ) {
          const rates: Record<string, Record<string, number>> = {
            euro: { chf: 0.93, mkd: 61.5 },
            chf: { euro: 1.075, mkd: 66.13 },
            mkd: { euro: 0.01626, chf: 0.01512 },
          };
          const from = chunk.currency.toLowerCase();
          const to = ticketCurrency.toLowerCase();
          const rate = rates[from]?.[to] || 1;
          totalPaidInTicketCurrency +=
            Math.round(chunk.amount * rate * 100) / 100;
        } else {
          totalPaidInTicketCurrency += chunk.amount;
        }
      }

      const remainingDebt =
        Math.round((newPrice - totalPaidInTicketCurrency) * 100) / 100;

      const existingDebt = await this.transactionService.findByTicketDebt(id);
      if (existingDebt) {
        if (remainingDebt > 0) {
          await this.transactionService.update(
            (existingDebt as any)._id.toString(),
            { amount: remainingDebt },
          );
        } else {
          await this.transactionService.remove(
            (existingDebt as any)._id.toString(),
          );
        }
      } else if (remainingDebt > 0) {
        await this.transactionService.create({
          amount: remainingDebt,
          currency: ticketCurrency as any,
          type: TransactionTypes.DEBT,
          status: TransactionStatus.PENDING,
          ticket: id,
          agency: agencyId,
          user: employeeId,
          description: `Borxh - Biletë avioni e papaguar (${ticket.uid})`,
        });
      }

      if (remainingDebt <= 0 && hasAnyPayments) {
        await this.ticketModel.updateOne(
          { _id: id },
          { $set: { payment_status: PaymentStatusTypes.PAID } },
        );
      } else if (remainingDebt > 0 && hasAnyPayments) {
        await this.ticketModel.updateOne(
          { _id: id },
          { $set: { payment_status: PaymentStatusTypes.PARTIALLY_PAID } },
        );
      } else if (!hasAnyPayments) {
        await this.ticketModel.updateOne(
          { _id: id },
          { $set: { payment_status: PaymentStatusTypes.UNPAID } },
        );
      }
    }

    if (priceChanged) {
      this.mailService
        .sendPriceChangeEmail(
          oldPrice,
          newPrice,
          ticketCurrency,
          ticket.uid || 'N/A',
          id,
        )
        .catch((err) =>
          console.error('Failed to send price change email:', err),
        );
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

    await this.transactionService.deleteByTicket(id);

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

  async checkInReturn(
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
        { $set: { return_checked_in: checkedIn } },
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
      checkedIn ? 'Return Check-in i kryer' : 'Return Check-in i anuluar',
      checkedIn
        ? 'Pasagjeri bëri return check-in me sukses.'
        : 'Anulimi i statusit return check-in.',
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

    ticket.status = 'canceled';
    if (note) {
      ticket.note = ticket.note
        ? `${ticket.note}\n\nAnulimi: ${note}`
        : `Anulimi: ${note}`;
    }

    const wasUnpaid =
      ticket.payment_status === PaymentStatusTypes.UNPAID ||
      ticket.payment_status === PaymentStatusTypes.NOT_PAID;

    const employeeAgencyId = await this.getEmployeeAgencyId(cancelTicketDto.employee);

    if (wasUnpaid) {
      await this.transactionService.deleteByTicket(id);
    } else {
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
            agency: employeeAgencyId,
            user: cancelTicketDto.employee,
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

    if (!ticket.payment_chunks) {
      ticket.payment_chunks = [];
    }

    const employeeAgencyId = await this.getEmployeeAgencyId(refundDto.employee);

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
        agency: employeeAgencyId,
        user: refundDto.employee,
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
