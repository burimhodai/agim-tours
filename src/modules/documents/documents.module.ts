import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentSchema } from '../../models/document.model';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';

@Module({
    imports: [MongooseModule.forFeature([{ name: 'Document', schema: DocumentSchema }])],
    providers: [DocumentsService],
    controllers: [DocumentsController],
    exports: [DocumentsService],
})
export class DocumentsModule { }
