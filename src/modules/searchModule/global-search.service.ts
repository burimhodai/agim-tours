import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ITicket, TicketTypes } from 'src/shared/types/ticket.types';
import { IUser } from 'src/shared/types/user.types';

export interface SearchResult {
    type: 'bus_ticket' | 'plane_ticket' | 'hotel_reservation' | 'event' | 'user' | 'bus';
    id: string;
    title: string;
    subtitle: string;
    metadata?: Record<string, any>;
}

export interface GlobalSearchResponse {
    results: SearchResult[];
    total: number;
    query: string;
}

@Injectable()
export class GlobalSearchService {
    constructor(
        @InjectModel('Ticket') private ticketModel: Model<ITicket>,
        @InjectModel('User') private userModel: Model<IUser>,
        @InjectModel('EventHotel') private eventHotelModel: Model<any>,
        @InjectModel('EventBus') private eventBusModel: Model<any>,
        @InjectModel('HotelReservation') private hotelReservationModel: Model<any>,
    ) { }

    async search(query: string, agencyId?: string, limit: number = 10): Promise<GlobalSearchResponse> {
        if (!query || query.trim().length < 2) {
            return { results: [], total: 0, query };
        }

        const searchRegex = new RegExp(query, 'i');
        const results: SearchResult[] = [];

        // Build agency filter
        const agencyFilter = agencyId ? { agency: new Types.ObjectId(agencyId) } : {};

        // Search Bus Tickets
        const busTickets = await this.ticketModel
            .find({
                ...agencyFilter,
                ticket_type: TicketTypes.BUS,
                is_deleted: { $ne: true },
                $or: [
                    { uid: searchRegex },
                    { booking_reference: searchRegex },
                    { departure_location: searchRegex },
                    { destination_location: searchRegex },
                    { 'passengers.first_name': searchRegex },
                    { 'passengers.last_name': searchRegex },
                    { 'passengers.phone': searchRegex },
                    { 'passengers.passport_number': searchRegex },
                ],
            })
            .limit(limit)
            .lean();

        for (const ticket of busTickets) {
            const passengerName = ticket.passengers?.[0]
                ? `${ticket.passengers[0].first_name || ''} ${ticket.passengers[0].last_name || ''}`.trim()
                : 'Pa pasagjer';
            results.push({
                type: 'bus_ticket',
                id: ticket._id.toString(),
                title: `🚌 ${ticket.uid || ticket.booking_reference || 'Biletë Autobusi'}`,
                subtitle: `${ticket.departure_location} → ${ticket.destination_location} • ${passengerName}`,
                metadata: {
                    departure_date: ticket.departure_date,
                    price: ticket.price,
                    currency: ticket.currency,
                },
            });
        }

        // Search Plane Tickets
        const planeTickets = await this.ticketModel
            .find({
                ...agencyFilter,
                ticket_type: TicketTypes.PLANE,
                is_deleted: { $ne: true },
                $or: [
                    { uid: searchRegex },
                    { booking_reference: searchRegex },
                    { departure_location: searchRegex },
                    { destination_location: searchRegex },
                    { 'passengers.first_name': searchRegex },
                    { 'passengers.last_name': searchRegex },
                ],
            })
            .limit(limit)
            .lean();

        for (const ticket of planeTickets) {
            const passengerName = ticket.passengers?.[0]
                ? `${ticket.passengers[0].first_name || ''} ${ticket.passengers[0].last_name || ''}`.trim()
                : 'Pa pasagjer';
            results.push({
                type: 'plane_ticket',
                id: ticket._id.toString(),
                title: `✈️ ${ticket.uid || ticket.booking_reference || 'Biletë Avioni'}`,
                subtitle: `${ticket.departure_location} → ${ticket.destination_location} • ${passengerName}`,
                metadata: {
                    departure_date: ticket.departure_date,
                    price: ticket.price,
                    currency: ticket.currency,
                },
            });
        }

        // Search Hotel Reservations
        const hotelReservations = await this.hotelReservationModel
            .find({
                ...agencyFilter,
                is_deleted: { $ne: true },
                $or: [
                    { hotel_booking_id: searchRegex },
                    { hotel_name: searchRegex },
                    { 'travelers.full_name': searchRegex },
                    { 'travelers.passport_number': searchRegex },
                ],
            })
            .limit(limit)
            .lean();

        for (const reservation of hotelReservations) {
            const travelerName = reservation.travelers?.[0]?.full_name || 'Pa udhëtar';
            results.push({
                type: 'hotel_reservation',
                id: reservation._id.toString(),
                title: `🏨 ${reservation.hotel_booking_id || 'Rezervim Hoteli'}`,
                subtitle: `${reservation.hotel_name || 'Hotel'} • ${travelerName}`,
                metadata: {
                    check_in: reservation.check_in_date,
                    check_out: reservation.check_out_date,
                    status: reservation.status,
                },
            });
        }

        // Search Events (Udhëtim + Hotel)
        const events = await this.eventHotelModel
            .find({
                ...agencyFilter,
                is_deleted: { $ne: true },
                $or: [
                    { uid: searchRegex },
                    { name: searchRegex },
                    { location: searchRegex },
                    { 'travelers.first_name': searchRegex },
                    { 'travelers.last_name': searchRegex },
                ],
            })
            .limit(limit)
            .lean();

        for (const event of events) {
            results.push({
                type: 'event',
                id: event._id.toString(),
                title: `📅 ${event.name}`,
                subtitle: `${event.location} • ${event.travelers?.length || 0} udhëtarë`,
                metadata: {
                    date: event.date,
                    return_date: event.return_date,
                },
            });
        }

        // Search Users (admin only - but we'll return them anyway, frontend can filter)
        const users = await this.userModel
            .find({
                $or: [
                    { email: searchRegex },
                    { first_name: searchRegex },
                    { last_name: searchRegex },
                ],
            })
            .limit(limit)
            .lean();

        for (const user of users) {
            results.push({
                type: 'user',
                id: user._id.toString(),
                title: `👤 ${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
                subtitle: user.email,
                metadata: {
                    role: user.role,
                },
            });
        }

        // Search Buses
        const buses = await this.eventBusModel
            .find({
                ...agencyFilter,
                $or: [
                    { name: searchRegex },
                    { plates: searchRegex },
                    { model: searchRegex },
                    { drivers: searchRegex },
                ],
            })
            .limit(limit)
            .lean();

        for (const bus of buses) {
            results.push({
                type: 'bus',
                id: bus._id.toString(),
                title: `🚌 ${bus.name}`,
                subtitle: `${bus.plates || 'Pa targa'} • ${bus.model || 'Pa model'}`,
                metadata: {
                    capacity: bus.capacity,
                    drivers: bus.drivers,
                },
            });
        }

        // Sort results by relevance (exact matches first)
        results.sort((a, b) => {
            const aExact = a.title.toLowerCase().includes(query.toLowerCase()) ? 0 : 1;
            const bExact = b.title.toLowerCase().includes(query.toLowerCase()) ? 0 : 1;
            return aExact - bExact;
        });

        return {
            results: results.slice(0, limit),
            total: results.length,
            query,
        };
    }
}
