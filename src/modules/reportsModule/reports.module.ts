import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportsController } from './controllers/reports.controller';
import { ReportsService } from './services/reports.service';
import { SeedDataService } from './services/seed-data.service';
import { TransactionSchema } from 'src/models/transaction.model';
import { TicketSchema } from 'src/models/ticket.model';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'Transaction', schema: TransactionSchema },
            { name: 'Ticket', schema: TicketSchema },
        ]),
    ],
    controllers: [ReportsController],
    providers: [ReportsService, SeedDataService],
    exports: [ReportsService],
})
export class ReportsModule { }
