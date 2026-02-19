import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

interface CreateLoyalCustomerDto {
  title?: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  passport_number?: string;
  passport_expiry_date?: Date;
  date_of_birth?: Date;
  nationality?: string;
  address?: string;
  city?: string;
  country?: string;
  notes?: string;
}

interface UpdateLoyalCustomerDto extends Partial<CreateLoyalCustomerDto> { }

interface AddPurchaseDto {
  ticket_type: 'bus' | 'plane' | 'hotel' | 'event';
  ticket_id?: string;
  booking_reference?: string;
  departure_location?: string;
  destination_location?: string;
  travel_date?: Date;
  amount?: number;
  currency?: string;
}

@Injectable()
export class LoyalCustomerService {
  constructor(
    @InjectModel('LoyalCustomer')
    private readonly loyalCustomerModel: Model<any>,
    @InjectModel('Agency') private readonly agencyModel: Model<any>,
  ) { }

  private async getAgencyId(agency: any): Promise<any> {
    if (agency && agency._id) return agency._id;
    const defaultAgency = await this.agencyModel.findOne().select('_id').lean();
    if (!defaultAgency) throw new Error('No agency found');
    return defaultAgency._id;
  }

  async create(data: CreateLoyalCustomerDto, agency: any) {
    const agencyId = await this.getAgencyId(agency);
    const customer = new this.loyalCustomerModel({
      ...data,
      agency: agencyId,
    });
    return customer.save();
  }

  async findAll(agency: any) {
    const agencyId = await this.getAgencyId(agency);
    return this.loyalCustomerModel
      .find({ agency: agencyId, is_deleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .lean();
  }

  async findOne(id: string, agency: any) {
    const agencyId = await this.getAgencyId(agency);
    return this.loyalCustomerModel
      .findOne({
        _id: new Types.ObjectId(id),
        agency: agencyId,
        is_deleted: { $ne: true },
      })
      .lean();
  }

  async update(id: string, data: UpdateLoyalCustomerDto, agency: any) {
    const agencyId = await this.getAgencyId(agency);
    return this.loyalCustomerModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), agency: agencyId },
        { $set: data },
        { new: true },
      )
      .lean();
  }

  async delete(id: string, agency: any) {
    const agencyId = await this.getAgencyId(agency);
    return this.loyalCustomerModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), agency: agencyId },
        { $set: { is_deleted: true } },
        { new: true },
      )
      .lean();
  }

  async search(query: string, agency: any, limit: number = 10) {
    const agencyId = await this.getAgencyId(agency);
    const searchRegex = new RegExp(query, 'i');
    return this.loyalCustomerModel
      .find({
        agency: agencyId,
        is_deleted: { $ne: true },
        $or: [
          { first_name: searchRegex },
          { last_name: searchRegex },
          { phone: searchRegex },
          { passport_number: searchRegex },
          { email: searchRegex },
        ],
      })
      .limit(limit)
      .lean();
  }

  async addPurchase(
    customerId: string,
    purchaseData: AddPurchaseDto,
    agency: any,
  ) {
    const agencyId = await this.getAgencyId(agency);
    const ticketRefModel =
      purchaseData.ticket_type === 'bus' || purchaseData.ticket_type === 'plane'
        ? 'Ticket'
        : purchaseData.ticket_type === 'hotel'
          ? 'HotelReservation'
          : 'EventHotel';

    return this.loyalCustomerModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(customerId), agency: agencyId },
        {
          $push: {
            purchase_history: {
              ...purchaseData,
              ticket_ref_model: ticketRefModel,
              ticket_id: purchaseData.ticket_id
                ? new Types.ObjectId(purchaseData.ticket_id)
                : undefined,
              purchased_at: new Date(),
            },
          },
          $inc: {
            total_purchases: 1,
            total_spent: purchaseData.amount || 0,
          },
        },
        { new: true },
      )
      .lean();
  }

  async getCustomerStats(customerId: string, agency: any) {
    const agencyId = await this.getAgencyId(agency);
    const customer = await this.loyalCustomerModel
      .findOne({
        _id: new Types.ObjectId(customerId),
        agency: agencyId,
        is_deleted: { $ne: true },
      })
      .lean();

    if (!customer) return null;

    // Calculate stats by type
    const statsByType = {
      bus: { count: 0, total: 0 },
      plane: { count: 0, total: 0 },
      hotel: { count: 0, total: 0 },
      event: { count: 0, total: 0 },
    };

    (customer.purchase_history || []).forEach((purchase: any) => {
      const ticketType = purchase.ticket_type as keyof typeof statsByType;
      if (ticketType && statsByType[ticketType]) {
        statsByType[ticketType].count++;
        statsByType[ticketType].total += purchase.amount || 0;
      }
    });

    return {
      customer,
      stats: {
        total_purchases: customer.total_purchases || 0,
        total_spent: customer.total_spent || 0,
        by_type: statsByType,
      },
    };
  }
}
