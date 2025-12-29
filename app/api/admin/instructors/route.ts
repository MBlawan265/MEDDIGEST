import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'owner') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const instructors = await User.find({ role: 'instructor' })
            .select('-password') // Exclude password
            .sort({ createdAt: -1 });

        return NextResponse.json(instructors);
    } catch (error) {
        console.error('Error fetching instructors:', error);
        return NextResponse.json(
            { error: 'Failed to fetch instructors' },
            { status: 500 }
        );
    }
}

// POST - Create new instructor (Admin only)
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'owner') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { username, email, password } = await req.json();

        // Validation
        if (!username || !email || !password) {
            return NextResponse.json({ error: 'Username, email, and password are required' }, { status: 400 });
        }

        if (password.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
        }

        await connectToDatabase();

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email: email.toLowerCase() }, { username }],
        });

        if (existingUser) {
            if (existingUser.email === email.toLowerCase()) {
                return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
            }
            return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newInstructor = await User.create({
            username,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: 'instructor',
        });

        // Return without password
        const instructorData = newInstructor.toObject();
        delete instructorData.password;

        return NextResponse.json(instructorData, { status: 201 });
    } catch (error) {
        console.error('Error creating instructor:', error);
        return NextResponse.json(
            { error: 'Failed to create instructor' },
            { status: 500 }
        );
    }
}
