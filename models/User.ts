import mongoose, { Schema, Model, Document } from 'mongoose';

export enum UserRole {
    OWNER = 'owner',
    INSTRUCTOR = 'instructor',
    STUDENT = 'student'
}

export interface IUser extends Document {
    username: string;
    fullName?: string;
    email: string;
    password?: string;
    whatsapp?: string;
    institution?: string;
    role: UserRole;
    profilePicture?: string;
    isBanned: boolean;
    enrolledCourses: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
    {
        username: {
            type: String,
            required: [true, 'Please provide a username'],
            unique: true,
            trim: true,
            minlength: [3, 'Username must be at least 3 characters'],
        },
        fullName: {
            type: String,
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
        },
        whatsapp: {
            type: String,
            required: function (this: IUser) {
                return this.role === UserRole.STUDENT;
            },
            trim: true,
        },
        institution: {
            type: String,
            required: function (this: IUser) {
                return this.role === UserRole.STUDENT;
            },
            trim: true,
        },
        role: {
            type: String,
            enum: Object.values(UserRole),
            default: UserRole.STUDENT,
        },
        profilePicture: {
            type: String,
            default: '',
        },
        isBanned: {
            type: Boolean,
            default: false,
        },
        enrolledCourses: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Course',
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Prevent model recompilation error in development
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
