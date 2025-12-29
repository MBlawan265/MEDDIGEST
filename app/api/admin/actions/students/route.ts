import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Course from '@/models/Course';
import Progress from '@/models/Progress';

export const dynamic = 'force-dynamic';

// GET: List Students
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'owner') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    // Fetch students primarily
    const students = await User.find({ role: 'student' }).select('-password').sort({ createdAt: -1 });
    return NextResponse.json(students);
}
