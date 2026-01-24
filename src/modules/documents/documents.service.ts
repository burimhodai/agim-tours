import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IDocument } from '../../models/document.model';
import * as cloudinary from 'cloudinary';
import { Readable } from 'stream';

console.log(process.env.CLOUDINARY_CLOUD_NAME);
console.log(process.env.CLOUDINARY_API_KEY);
console.log(process.env.CLOUDINARY_API_SECRET);
cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dwlhuryyu",
    api_key: process.env.CLOUDINARY_API_KEY || "449936292515378",
    api_secret: process.env.CLOUDINARY_API_SECRET || "QbR4DETjkU7L0AUdQWRkjkgketg",
});

@Injectable()
export class DocumentsService {
    constructor(
        @InjectModel('Document') private readonly documentModel: Model<IDocument>,
    ) { }

    async uploadDocument(
        file: Express.Multer.File,
        name?: string,
    ): Promise<IDocument> {
        if (!file) {
            throw new BadRequestException('No file provided');
        }
        const stream = Readable.from(file.buffer);
        const uploadResult = await new Promise<any>((resolve, reject) => {
            const uploadStream = cloudinary.v2.uploader.upload_stream(
                { resource_type: 'raw' },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                },
            );
            stream.pipe(uploadStream);
        });
        console.log({ uploadResult });

        const created = new this.documentModel({
            cloudinaryUrl: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            filename: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            name: name || file.originalname,
        });
        return created.save();
    }

    async findAll(): Promise<IDocument[]> {
        return this.documentModel.find().exec();
    }

    async findOne(id: string): Promise<IDocument | null> {
        return this.documentModel.findById(id).exec();
    }

    async delete(id: string): Promise<void> {
        const doc = await this.documentModel.findById(id).exec();
        if (!doc) {
            throw new BadRequestException('Document not found');
        }
        await cloudinary.v2.uploader.destroy(doc.publicId, { resource_type: 'auto' });
        await this.documentModel.deleteOne({ _id: id }).exec();
    }
}
