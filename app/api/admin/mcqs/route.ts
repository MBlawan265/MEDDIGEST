import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Mcq from '@/models/MCQ';
import User, { UserRole } from '@/models/User';

// GET all MCQs (Admin only)
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Check if admin or owner (or instructor if they will be allowed later)
        if (session.user.role !== 'owner' && session.user.role !== 'admin') {
            // If we want to allow instructors later, add logic here.
            // For now, based on "Admin Dashboard", we assume owners/admins.
            // Note: User model has 'owner', 'instructor', 'student' roles.
            if (session.user.role !== UserRole.OWNER) {
                return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
            }
        }

        await connectToDatabase();
        const mcqs = await Mcq.find({}).sort({ createdAt: -1 });

        return NextResponse.json(mcqs);
    } catch (error) {
        console.error('Error fetching MCQs:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

// POST create a new MCQ
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        if (session.user.role !== UserRole.OWNER) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const data = await req.json();

        // Basic validation
        if (!data.title) {
            return NextResponse.json({ message: 'Title is required' }, { status: 400 });
        }

        await connectToDatabase();

        const newMcq = await Mcq.create({
            ...data,
            createdBy: session.user.id,
        });

        return NextResponse.json(newMcq, { status: 201 });
    } catch (error) {
        console.error('Error creating MCQ:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
