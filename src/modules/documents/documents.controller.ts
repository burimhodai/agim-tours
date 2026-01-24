import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    UploadedFile,
    UseInterceptors,
    Body,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { IDocument } from '../../models/document.model';

@Controller('documents')
export class DocumentsController {
    constructor(private readonly documentsService: DocumentsService) { }

    @Post()
    @UseInterceptors(FileInterceptor('file'))
    async upload(
        @UploadedFile() file: Express.Multer.File,
        @Body('name') name?: string,
    ): Promise<IDocument> {
        return this.documentsService.uploadDocument(file, name);
    }

    @Get()
    async findAll(): Promise<IDocument[]> {
        return this.documentsService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<IDocument | null> {
        return this.documentsService.findOne(id);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(@Param('id') id: string): Promise<void> {
        return this.documentsService.delete(id);
    }
}
