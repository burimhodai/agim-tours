import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ITransaction, TransactionTypes } from 'src/shared/types/transaction.types';
import { ITicket, TicketTypes } from 'src/shared/types/ticket.types';
import { CurrencyTypes } from 'src/shared/types/currency.types';
import { PaymentStatusTypes } from 'src/shared/types/payment.types';

@Injectable()
export class SeedDataService {
    constructor(
        @InjectModel('Transaction') private transactionModel: Model<ITransaction>,
        @InjectModel('Ticket') private ticketModel: Model<ITicket>,
    ) { }

    async seedReportData() {
        console.log('Starting to seed report data...');

        const currencies = [CurrencyTypes.EURO, CurrencyTypes.MKD, CurrencyTypes.CHF];
        const ticketTypes = [TicketTypes.BUS, TicketTypes.PLANE];

        const routes = {
            bus: [
                { from: 'Skopje', to: 'Berlin', operator: 'FlixBus' },
                { from: 'Pristina', to: 'Munich', operator: 'Eurolines' },
                { from: 'Tirana', to: 'Vienna', operator: 'FlixBus' },
                { from: 'Belgrade', to: 'Hamburg', operator: 'Eurolines' },
            ],
            plane: [
                { from: 'Skopje', to: 'Frankfurt', operator: 'Lufthansa' },
                { from: 'Pristina', to: 'Zurich', operator: 'Swiss Air' },
                { from: 'Tirana', to: 'Istanbul', operator: 'Turkish Airlines' },
                { from: 'Belgrade', to: 'Paris', operator: 'Air France' },
            ],
        };

        const createdTickets: any[] = [];

        for (let i = 0; i < 30; i++) {
            const ticketType = ticketTypes[Math.floor(Math.random() * ticketTypes.length)];
            const routeList = ticketType === TicketTypes.BUS ? routes.bus : routes.plane;
            const route = routeList[Math.floor(Math.random() * routeList.length)];
            const currency = currencies[Math.floor(Math.random() * currencies.length)];

            const basePrice = ticketType === TicketTypes.BUS ? 80 : 150;
            const price = basePrice + Math.random() * (ticketType === TicketTypes.BUS ? 70 : 300);

            const daysAhead = Math.floor(Math.random() * 60) - 30;
            const departureDate = new Date();
            departureDate.setDate(departureDate.getDate() + daysAhead);

            const arrivalDate = new Date(departureDate);
            arrivalDate.setHours(departureDate.getHours() + (ticketType === TicketTypes.BUS ? 20 : 3));

            const numPassengers = Math.floor(Math.random() * 3) + 1;
            const passengers = [];

            for (let p = 0; p < numPassengers; p++) {
                passengers.push({
                    first_name: `Passenger${p + 1}`,
                    last_name: `Test${i}`,
                    passport_number: `PS${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                    phone: `+38977${Math.floor(Math.random() * 1000000)}`,
                });
            }

            const ticket = new this.ticketModel({
                ticket_type: ticketType,
                booking_reference: `${ticketType.toUpperCase()}${Date.now()}${i}`,
                price,
                currency,
                departure_date: departureDate,
                arrival_date: arrivalDate,
                departure_location: route.from,
                destination_location: route.to,
                operator: route.operator,
                passengers,
                checked_in: false,
                payment_status: PaymentStatusTypes.PAID,
            });

            const savedTicket = await ticket.save();
            createdTickets.push(savedTicket);

            const incomeTransaction = new this.transactionModel({
                amount: price,
                currency,
                type: TransactionTypes.INCOME,
                ticket: savedTicket._id,
                description: `${ticketType} ticket sale: ${route.from} to ${route.to}`,
                to: `Customer ${i + 1}`,
            });

            await incomeTransaction.save();

            if (Math.random() > 0.7) {
                const commission = price * 0.1;
                const outcomeTransaction = new this.transactionModel({
                    amount: commission,
                    currency,
                    type: TransactionTypes.OUTCOME,
                    ticket: savedTicket._id,
                    description: `Commission for ${ticketType} ticket`,
                    to: route.operator,
                });

                await outcomeTransaction.save();
            }

            if (Math.random() > 0.8) {
                const fee = Math.random() * 20 + 5;
                const feeTransaction = new this.transactionModel({
                    amount: fee,
                    currency,
                    type: TransactionTypes.OUTCOME,
                    ticket: savedTicket._id,
                    description: `Processing fee for ${ticketType} ticket`,
                    to: 'Payment Processor',
                });

                await feeTransaction.save();
            }
        }

        console.log('✅ Successfully seeded report data!');
        console.log(`   - Created ${createdTickets.length} tickets`);
        console.log(`   - Generated income and outcome transactions`);
        console.log(`   - Mixed currencies: EURO, MKD, CHF`);
        console.log(`   - Both BUS and PLANE tickets`);

        // Also create some standalone transactions (without tickets) for today
        const standaloneTransactions = [
            {
                amount: 150,
                currency: CurrencyTypes.EURO,
                type: TransactionTypes.INCOME,
                description: 'Shërbim konsulence',
                to: 'Klienti A',
            },
            {
                amount: 75.50,
                currency: CurrencyTypes.EURO,
                type: TransactionTypes.INCOME,
                description: 'Pagesë për rezervim',
                to: 'Klienti B',
            },
            {
                amount: 250,
                currency: CurrencyTypes.CHF,
                type: TransactionTypes.INCOME,
                description: 'Komision agjensie',
                to: 'Partneri Swiss',
            },
            {
                amount: 45,
                currency: CurrencyTypes.EURO,
                type: TransactionTypes.OUTCOME,
                description: 'Materiale zyre',
                to: 'Furnitori',
            },
            {
                amount: 120,
                currency: CurrencyTypes.EURO,
                type: TransactionTypes.OUTCOME,
                description: 'Pagesa e shërbimeve',
                to: 'Kompania X',
            },
        ];

        for (const tx of standaloneTransactions) {
            const transaction = new this.transactionModel(tx);
            await transaction.save();
        }

        console.log(`   - Created ${standaloneTransactions.length} standalone transactions for today`);

        return {
            message: 'Seed data created successfully',
            ticketsCreated: createdTickets.length,
            standaloneTransactions: standaloneTransactions.length,
        };
    }

    async clearReportData() {
        console.log('🗑️  Clearing existing report data...');

        await this.transactionModel.deleteMany({});
        await this.ticketModel.deleteMany({});

        console.log('✅ Cleared all tickets and transactions');

        return { message: 'Data cleared successfully' };
    }
}
