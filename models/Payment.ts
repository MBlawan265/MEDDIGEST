import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IPayment extends Document {
    userId: mongoose.Types.ObjectId;
    courseId: mongoose.Types.ObjectId;
    amount: number;
    currency: string;
    paystackReference: string;
    paystackEventId?: string; // For webhook idempotency
    status: 'pending' | 'successful' | 'failed';
    metadata: any;
    createdAt: Date;
    verifiedAt?: Date;
}

const PaymentSchema: Schema<IPayment> = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
        amount: { type: Number, required: true },
        currency: { type: String, default: 'NGN' },
        paystackReference: { type: String, required: true, unique: true },
        paystackEventId: { type: String, unique: true, sparse: true },
        status: {
            type: String,
            enum: ['pending', 'successful', 'failed'],
            default: 'pending'
        },
        metadata: { type: Object },
        verifiedAt: { type: Date }
    },
    {
        timestamps: true,
    }
);

const Payment: Model<IPayment> = mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;
