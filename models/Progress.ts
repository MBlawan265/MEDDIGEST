import mongoose, { Schema, Model, Document } from 'mongoose';

export interface ILessonProgress {
    lessonId: mongoose.Types.ObjectId;
    sectionId: mongoose.Types.ObjectId;
    watchedSeconds: number;
    totalDuration: number;
    completed: boolean;
    completedAt?: Date;
}

export interface ICompletedLesson {
    lessonId: mongoose.Types.ObjectId;
    sectionId: mongoose.Types.ObjectId;
    completedAt: Date;
}

const LessonProgressSchema = new Schema({
    lessonId: { type: Schema.Types.ObjectId, required: true },
    sectionId: { type: Schema.Types.ObjectId, required: true },
    watchedSeconds: { type: Number, default: 0 },
    totalDuration: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date }
}, { _id: false });

const CompletedLessonSchema = new Schema({
    lessonId: { type: Schema.Types.ObjectId, required: true },
    sectionId: { type: Schema.Types.ObjectId, required: true },
    completedAt: { type: Date, default: Date.now }
}, { _id: false });

export interface IProgress extends Document {
    userId: mongoose.Types.ObjectId;
    courseId: mongoose.Types.ObjectId;
    completedLessons: ICompletedLesson[];
    lessonProgress: ILessonProgress[];
    percentage: number;
    lastAccessedAt: Date;
    isCompleted: boolean;
    lastLessonId?: mongoose.Types.ObjectId;
    lastSectionId?: mongoose.Types.ObjectId;
    lastPlaybackTime?: number;
    createdAt: Date;
    updatedAt: Date;
}

const ProgressSchema: Schema<IProgress> = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
        completedLessons: [CompletedLessonSchema],
        lessonProgress: [LessonProgressSchema],
        percentage: { type: Number, default: 0, min: 0, max: 100 },
        lastAccessedAt: { type: Date, default: Date.now },
        isCompleted: { type: Boolean, default: false },
        lastLessonId: { type: Schema.Types.ObjectId },
        lastSectionId: { type: Schema.Types.ObjectId },
        lastPlaybackTime: { type: Number, default: 0 }
    },
    {
        timestamps: true,
    }
);

// Compound index to prevent duplicate progress records
ProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const Progress: Model<IProgress> = mongoose.models.Progress || mongoose.model<IProgress>('Progress', ProgressSchema);

export default Progress;
