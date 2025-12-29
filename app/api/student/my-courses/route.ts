import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Course from '@/models/Course';
import Progress from '@/models/Progress';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        // Fetch User with Enrolled Courses
        const user = await User.findById(session.user.id).populate({
            path: 'enrolledCourses',
            populate: { path: 'instructor', select: 'fullName username' }
        });

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const enrolledCourses = user.enrolledCourses || [];

        // Fetch Progress for each course
        const coursesWithProgress = await Promise.all(enrolledCourses.map(async (course: any) => {
            const progress = await Progress.findOne({
                userId: session.user.id,
                courseId: course._id
            });

            return {
                ...course.toObject(),
                progress: progress ? progress.percentage : 0,
                lastAccessed: progress ? progress.updatedAt : null
            };
        }));

        return NextResponse.json({ courses: coursesWithProgress });

    } catch (error) {
        console.error('Error fetching my courses:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
