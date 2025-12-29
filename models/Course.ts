import mongoose, { Schema, Model, Document } from 'mongoose';

export interface ILesson {
    _id?: mongoose.Types.ObjectId;
    title: string;
    youtubeUrl?: string;
    driveId?: string;
    notes?: string;
    pdfs: {
        title: string;
        url: string;
        filename: string;
    }[];
    order: number;
    isPreview: boolean;
    duration?: number;
}

export interface ISection {
    _id?: mongoose.Types.ObjectId;
    title: string;
    order: number;
    lessons: ILesson[];
}

export interface ICourse extends Document {
    title: string;
    description: string;
    thumbnail: string;
    instructor: mongoose.Types.ObjectId;
    sections: ISection[];
    price: number;
    totalLessons: number;
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const LessonSchema = new Schema({
    title: { type: String, required: true },
    youtubeUrl: { type: String }, // Deprecated, optional
    driveId: { type: String }, // Google Drive File ID
    notes: { type: String },
    pdfs: [{
        title: { type: String, required: true },
        url: { type: String, required: true },
        filename: { type: String, required: true }
    }],
    order: { type: Number, required: true },
    isPreview: { type: Boolean, default: false },
    duration: { type: Number, default: 0 } // Duration in seconds
});

const SectionSchema = new Schema({
    title: { type: String, required: true },
    order: { type: Number, required: true },
    lessons: [LessonSchema]
});

const CourseSchema: Schema<ICourse> = new Schema(
    {
        title: {
            type: String,
            required: [true, 'Course title is required'],
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'Course description is required'],
        },
        thumbnail: {
            type: String,
            required: [true, 'Course thumbnail is required'],
        },
        instructor: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        sections: [SectionSchema],
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price cannot be negative'],
        },
        totalLessons: {
            type: Number,
            default: 0,
        },
        isPublished: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Pre-save hook to calculate total lessons and validate preview limit
(CourseSchema as any).pre('save', function (this: ICourse, next: any) {
    const course = this as ICourse;

    // Calculate total lessons
    let lessonCount = 0;
    let previewCount = 0;

    course.sections.forEach(section => {
        lessonCount += section.lessons.length;
        section.lessons.forEach(lesson => {
            if (lesson.isPreview) {
                previewCount++;
            }
        });
    });

    course.totalLessons = lessonCount;

    if (previewCount > 3) {
        return next(new Error('A course can have at most 3 preview videos'));
    }

    next();
});

const Course: Model<ICourse> = mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);

export default Course;
