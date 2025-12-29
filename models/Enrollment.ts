import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IEnrollment extends Document {
    userId: mongoose.Types.ObjectId;
    courseId: mongoose.Types.ObjectId;
    enrollmentType: 'purchase' | 'admin';
    status: 'active' | 'inactive';
    createdAt: Date;
    updatedAt: Date;
}

const EnrollmentSchema: Schema<IEnrollment> = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
        enrollmentType: {
            type: String,
            enum: ['purchase', 'admin'],
            required: true,
            default: 'purchase'
        },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active'
        }
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate active enrollments
EnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const Enrollment: Model<IEnrollment> = mongoose.models.Enrollment || mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);

export default Enrollment;
