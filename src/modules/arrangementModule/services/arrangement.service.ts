import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IArrangement } from 'src/shared/types/arrangement.types';
import { ITicket, TicketTypes } from 'src/shared/types/ticket.types';
import {
  CreateArrangementDto,
  UpdateArrangementDto,
  ArrangementQueryDto,
} from 'src/shared/DTO/arrangement.dto';

@Injectable()
export class ArrangementService {
  constructor(
    @InjectModel('Arrangement') private readonly arrangementModel: Model<IArrangement>,
    @InjectModel('Ticket') private readonly ticketModel: Model<ITicket>,
  ) { }

  private mapTravelersToPassengers(travelers: any[]) {
    return travelers.map((t) => ({
      title: t.title,
      first_name: t.first_name,
      last_name: t.last_name,
      phone: t.phone,
      passport_number: t.passport_number,
      birthdate: t.birthdate,
      passport_expiry_date: t.passport_expiry_date,
      passport_issue_date: t.passport_issue_date,
      nationality: t.nationality,
      luggage: t.luggage,
      return_luggage: t.return_luggage,
    }));
  }

  async create(createDto: CreateArrangementDto) {
    const ticketPassengers = this.mapTravelersToPassengers(createDto.travelers);
    const ticketUid = 'ARR-' + Math.random().toString(36).substr(2, 6).toUpperCase();

    const newTicket = new this.ticketModel({
      uid: ticketUid,
      ticket_type: TicketTypes.PLANE,
      price: 0,
      payment_status: 'paid', // prevent it from appearing in unpaid tickets list
      departure_date: createDto.departure_date,
      return_date: createDto.return_date,
      departure_location: createDto.departure_location,
      destination_location: createDto.destination_location,
      operator: createDto.operator,
      operatorId: createDto.operatorId,
      passengers: ticketPassengers,
      route_number: createDto.route_number,
      return_route_number: createDto.return_route_number,
      agency: createDto.agency,
      employee: createDto.employee,
      note: 'Created from Arrangement',
    });

    const savedTicket = await newTicket.save();

    const newArrangement = new this.arrangementModel({
      ...createDto,
      uid: 'PKG-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      plane_ticket_id: savedTicket._id,
    });

    const savedArrangement = await newArrangement.save();

    savedTicket.arrangement_id = savedArrangement._id as Types.ObjectId;
    await savedTicket.save();

    return savedArrangement;
  }

  async findAll(query: ArrangementQueryDto) {
    const filter: any = { is_deleted: false };

    if (query.destination) {
      filter.destination = { $regex: query.destination, $options: 'i' };
    }
    if (query.start_date_from || query.start_date_to) {
      filter.start_date = {};
      if (query.start_date_from) filter.start_date.$gte = query.start_date_from;
      if (query.start_date_to) filter.start_date.$lte = query.start_date_to;
    }
    if (query.payment_status) {
      filter.payment_status = query.payment_status;
    }
    if (query.agency) {
      filter.agency = query.agency;
    }
    if (query.q) {
      filter.name = { $regex: query.q, $options: 'i' };
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.arrangementModel
        .find({})
        .populate('hotel_partner')
        .populate('agency')
        .populate('employee')
        .populate('plane_ticket_id')
        .sort({ start_date: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.arrangementModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const arrangement = await this.arrangementModel
      .findById(id)
      .populate('hotel_partner')
      .populate('operatorId')
      .populate('agency')
      .populate('employee')
      .populate('plane_ticket_id')
      .exec();

    if (!arrangement || arrangement.is_deleted) {
      throw new NotFoundException('Arrangement not found');
    }

    return arrangement;
  }

  async update(id: string, updateDto: UpdateArrangementDto) {
    const arrangement = await this.arrangementModel.findById(id);
    if (!arrangement) throw new NotFoundException('Arrangement not found');

    Object.assign(arrangement, updateDto);
    const updatedArrangement = await arrangement.save();

    if (arrangement.plane_ticket_id) {
      const ticket = await this.ticketModel.findById(arrangement.plane_ticket_id);
      if (ticket) {
        let ticketChanged = false;
        if (updateDto.departure_date) { ticket.departure_date = updateDto.departure_date; ticketChanged = true; }
        if (updateDto.return_date) { ticket.return_date = updateDto.return_date; ticketChanged = true; }
        if (updateDto.departure_location) { ticket.departure_location = updateDto.departure_location; ticketChanged = true; }
        if (updateDto.destination_location) { ticket.destination_location = updateDto.destination_location; ticketChanged = true; }
        if (updateDto.operator) { ticket.operator = updateDto.operator; ticketChanged = true; }
        if (updateDto.operatorId) { ticket.operatorId = updateDto.operatorId; ticketChanged = true; }
        if (updateDto.route_number) { ticket.route_number = updateDto.route_number; ticketChanged = true; }
        if (updateDto.return_route_number) { ticket.return_route_number = updateDto.return_route_number; ticketChanged = true; }

        if (updateDto.travelers) {
          ticket.passengers = this.mapTravelersToPassengers(updateDto.travelers);
          ticketChanged = true;
        }

        if (ticketChanged) {
          await ticket.save();
        }
      }
    }

    return updatedArrangement;
  }

  async delete(id: string, employeeId?: string) {
    const arrangement = await this.arrangementModel.findById(id);
    if (!arrangement) throw new NotFoundException('Arrangement not found');

    arrangement.is_deleted = true;
    arrangement.status = 'canceled';
    if (employeeId) {
      if (!arrangement.logs) arrangement.logs = [];
      arrangement.logs.push({
        title: 'Deleted',
        description: 'Arrangement deleted',
        employee: employeeId as any,
        created_at: new Date(),
      });
    }
    await arrangement.save();

    if (arrangement.plane_ticket_id) {
      const ticket = await this.ticketModel.findById(arrangement.plane_ticket_id);
      if (ticket) {
        ticket.is_deleted = true;
        ticket.status = 'canceled';
        await ticket.save();
      }
    }

    return arrangement;
  }
}
