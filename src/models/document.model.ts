import mongoose, { Document as MongooseDocument } from 'mongoose';

export interface IDocument extends MongooseDocument {
    cloudinaryUrl: string;
    publicId: string;
    filename: string;
    mimeType: string;
    size: number;
    name?: string;
    createdAt: Date;
}

export const DocumentSchema = new mongoose.Schema(
    {
        cloudinaryUrl: { type: String, required: true },
        publicId: { type: String, required: true },
        filename: { type: String, required: true },
        mimeType: { type: String, required: true },
        size: { type: Number, required: true },
        name: { type: String },
        createdAt: { type: Date, default: Date.now },
    },
    { timestamps: true },
);
