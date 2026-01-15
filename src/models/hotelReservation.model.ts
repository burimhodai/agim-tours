import mongoose from 'mongoose';
import { ReservationStatus, RoomTypes } from 'src/shared/types/hotel.types';

export const HotelReservationSchema = new mongoose.Schema({
    hotel_booking_id: { type: String, required: true },
    hotel_partner: { type: mongoose.Schema.Types.ObjectId, ref: 'PartnerHotel' },
    hotel_name: { type: String, required: true },
    check_in_date: { type: Date, required: true },
    check_out_date: { type: Date, required: true },
    status: {
        type: String,
        enum: Object.values(ReservationStatus),
        default: ReservationStatus.PENDING
    },
    notes: { type: String },

    travelers: [{
        full_name: { type: String, required: true },
        passport_number: { type: String, required: true },
        date_of_birth: { type: Date, required: true },
        place_of_birth: { type: String, required: true },
        room_type: {
            type: String,
            enum: Object.values(RoomTypes),
            default: RoomTypes.DOUBLE
        },
        departure_place: { type: String, required: true },
        show_in_hotel_list: { type: Boolean, default: true },
        show_in_border_list: { type: Boolean, default: true },
        show_in_guide_list: { type: Boolean, default: true },
        bus_assignment: { type: String },
    }],

    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency' },

    logs: [{
        title: String,
        description: String,
        employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        created_at: { type: Date, default: Date.now }
    }],

    is_deleted: { type: Boolean, default: false },
}, {
    timestamps: true
});
