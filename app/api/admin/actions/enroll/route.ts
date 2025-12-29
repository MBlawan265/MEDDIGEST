import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Progress from '@/models/Progress';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'owner') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { userId, courseId } = await req.json();

    await connectToDatabase();

    // Add to Enrolled Courses
    await User.findByIdAndUpdate(userId, {
        $addToSet: { enrolledCourses: courseId }
    });

    // Init Progress
    const exists = await Progress.findOne({ userId, courseId });
    if (!exists) {
        await Progress.create({ userId, courseId, completedLessons: [], percentage: 0 });
    }

    return NextResponse.json({ message: 'Enrolled successfully' });
}
