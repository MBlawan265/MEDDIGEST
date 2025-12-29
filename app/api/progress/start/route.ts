import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Progress from '@/models/Progress';
import Course from '@/models/Course';
import User from '@/models/User';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { courseId, lessonId, sectionId } = await req.json();

    if (!courseId || !lessonId || !sectionId) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    try {
        await connectToDatabase();

        // 1. Check Course & Enrollment (Simplified, assumes frontend checks, but good to verify)
        // For performance, we might skip full enrollment check if we trust the session/middleware, 
        // but better safe.

        // We can optimize by assuming if progress exists, they are enrolled.
        // But let's check basic enrollment from User if progress doesn't exist.

        let progress = await Progress.findOne({ userId: session.user.id, courseId });

        if (!progress) {
            // Create if not exists (implies enrollment check needed ideally, but sticking to flow)
            // Re-verifying enrollment here is safer.
            const user = await User.findById(session.user.id);
            const isEnrolled = user?.enrolledCourses?.some((id: any) => id.toString() === courseId);

            // Also owner/instructor check?
            const course = await Course.findById(courseId);
            const isOwner = session.user.role === 'owner';
            const isInstructor = course?.instructor.toString() === session.user.id;

            if (!isEnrolled && !isOwner && !isInstructor) {
                return NextResponse.json({ message: 'Not enrolled' }, { status: 403 });
            }

            progress = await Progress.create({
                userId: session.user.id,
                courseId,
                completedLessons: [],
                lessonProgress: [],
                percentage: 0
            });
        }

        // 2. Add to lessonProgress if not exists
        const exists = progress.lessonProgress?.some((lp: any) => lp.lessonId.toString() === lessonId);

        if (!exists) {
            progress.lessonProgress.push({
                lessonId,
                sectionId,
                watchedSeconds: 0,
                totalDuration: 0,
                completed: false
            });
        }

        // 3. Update Last Accessed
        progress.lastAccessedAt = new Date();
        progress.lastLessonId = lessonId;
        progress.lastSectionId = sectionId;

        await progress.save();

        return NextResponse.json({ message: 'Lesson started tracked' });

    } catch (error) {
        console.error('Start lesson error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
