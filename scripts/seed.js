const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env.local');
    process.exit(1);
}

const UserSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: { type: String, enum: ['owner', 'instructor', 'student'], default: 'student' },
        isBanned: { type: Boolean, default: false },
        enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    },
    { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const adminEmail = 'example@admin.com';
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log('Default admin account already exists');
        } else {
            const hashedPassword = await bcrypt.hash('12345678', 12);
            await User.create({
                username: 'Admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'owner',
                isBanned: false,
                enrolledCourses: [],
            });
            console.log('Default admin account created: example@admin.com / 12345678');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seed();
