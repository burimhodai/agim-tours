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
} from 'src/shared/DTO/plane.dto';
import { PaymentStatusTypes } from 'src/shared/types/payment.types';
import { TransactionTypes } from 'src/shared/types/transaction.types';
import { TransactionServiceService } from 'src/transactions/transaction-service.service';

@Injectable()
export class PlaneService {
  constructor(
    @InjectModel('Ticket') private ticketModel: Model<ITicket>,
    private transactionService: TransactionServiceService,
  ) {}

  async create(createPlaneTicketDto: CreatePlaneTicketDto): Promise<ITicket> {
    const ticketData = {
      ...createPlaneTicketDto,
      ticket_type: TicketTypes.PLANE,
      agency: createPlaneTicketDto.agency
        ? new Types.ObjectId(createPlaneTicketDto.agency)
        : undefined,
      employee: createPlaneTicketDto.employee
        ? new Types.ObjectId(createPlaneTicketDto.employee)
        : undefined,
    };

    const newTicket = new this.ticketModel(ticketData);
    const savedTicket = await newTicket.save();

    await this.transactionService.create({
      amount: createPlaneTicketDto.price,
      currency: createPlaneTicketDto.currency,
      type: TransactionTypes.INCOME,
      ticket: savedTicket._id.toString(),
      agency: createPlaneTicketDto.agency,
      user: createPlaneTicketDto.employee,
    });

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
      throw new NotFoundException('Plane ticket not found');
    }

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

    return ticket;
  }

  async checkIn(id: string, checkedIn: boolean): Promise<ITicket> {
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
}
