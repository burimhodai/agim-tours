import mongoose from 'mongoose';
import { CurrencyTypes } from 'src/shared/types/currency.types';
import { PaymentStatusTypes } from 'src/shared/types/payment.types';

// Event Bus Schema - for buses assigned to an event
export const EventBusSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // Bus identification name
    plates: { type: String },
    model: { type: String },
    drivers: [{ type: String }],
    capacity: { type: Number },
    agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency' },
  },
  {
    timestamps: true,
  },
);

// Traveler/Passenger schema for events
const EventTravelerSchema = new mongoose.Schema({
  first_name: { type: String },
  last_name: { type: String },
  phone: { type: String },
  passport_number: { type: String },
  passport_expiry_date: { type: Date },
  date_of_birth: { type: Date },

  // Payment tracking for this traveler
  price: { type: Number },
  paid_amount: { type: Number, default: 0 },
  currency: {
    type: String,
    enum: Object.values(CurrencyTypes),
    default: CurrencyTypes.EURO,
  },
  payment_status: {
    type: String,
    enum: Object.values(PaymentStatusTypes),
    default: PaymentStatusTypes.UNPAID,
  },

  // Which lists to show this traveler in
  show_in_hotel_list: { type: Boolean, default: true },
  show_in_border_list: { type: Boolean, default: true },
  show_in_guide_list: { type: Boolean, default: true },

  // Room and hotel assignment
  room_type: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomType' },
  hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'PartnerHotel' },

  // Bus assignment
  bus: { type: mongoose.Schema.Types.ObjectId, ref: 'EventBus' },

  // Room group assignment (family grouping)
  room_group_id: { type: String },

  note: { type: String },
  pickup_location: { type: String },
});

// Main Event Hotel Schema
export const EventHotelSchema = new mongoose.Schema(
  {
    uid: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    location: { type: String, required: true },
    date: { type: Date, required: true }, // Data e nisjes
    return_date: { type: Date }, // Data e kthimit (opsionale)
    check_in_date: { type: Date }, // Data e hyrjes në hotel
    check_out_date: { type: Date }, // Data e daljes nga hoteli
    departure_city: { type: String },
    arrival_city: { type: String },

    price: { type: Number },
    currency: {
      type: String,
      enum: Object.values(CurrencyTypes),
      default: CurrencyTypes.EURO,
    },

    payment_status: {
      type: String,
      enum: Object.values(PaymentStatusTypes),
      default: PaymentStatusTypes.UNPAID,
    },

    travelers: [EventTravelerSchema],

    // Room groups - each group represents people sharing a room
    room_groups: [
      {
        group_id: { type: String, required: true }, // Unique identifier for the group
        room_type: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomType' },
        hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'PartnerHotel' },
        room_number: { type: String },
      },
    ],

    // Primary hotel for this event
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'PartnerHotel' },

    // Assigned buses for this event
    buses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EventBus' }],

    // Print column settings
    print_columns: {
      hotel_list: {
        type: [String],
        default: [
          'first_name',
          'last_name',
          'passport_number',
          'room_type',
          'hotel',
        ],
      },
      border_list: {
        type: [String],
        default: ['first_name', 'last_name', 'passport_number'],
      },
      guide_list: {
        type: [String],
        default: ['first_name', 'last_name', 'phone'],
      },
      bus_list: {
        type: [String],
        default: ['first_name', 'last_name', 'passport_number', 'phone'],
      },
    },

    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    logs: [
      {
        title: String,
        description: String,
        employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        created_at: { type: Date, default: Date.now },
      },
    ],
    agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency' },

    is_deleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);
