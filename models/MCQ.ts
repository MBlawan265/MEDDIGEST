import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMcqLink {
    buttonTitle: string;
    scriptUrl: string;
}

export interface IMcq extends Document {
    title: string;
    description?: string;
    thumbnail?: string;
    createdBy: mongoose.Types.ObjectId; // Admin/Owner ID
    isPublished: boolean;
    links: IMcqLink[];
    createdAt: Date;
    updatedAt: Date;
}

const McqSchema: Schema<IMcq> = new Schema(
    {
        title: {
            type: String,
            required: [true, 'Please provide an MCQ title'],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        thumbnail: {
            type: String,
            default: '',
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        isPublished: {
            type: Boolean,
            default: false,
        },
        links: [
            {
                buttonTitle: {
                    type: String,
                    required: [true, 'Button title is required'],
                    trim: true,
                },
                scriptUrl: {
                    type: String,
                    required: [true, 'Google Script URL is required'],
                    trim: true,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Prevent model recompilation error in development
const Mcq: Model<IMcq> = mongoose.models.Mcq || mongoose.model<IMcq>('Mcq', McqSchema);

export default Mcq;
