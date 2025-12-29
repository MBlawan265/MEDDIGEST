import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Progress from '@/models/Progress';
import Course from '@/models/Course';
import User from '@/models/User';
import mongoose from 'mongoose';

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

        // 1. Verify Course Existence
        const course = await Course.findById(courseId);
        if (!course) {
            return NextResponse.json({ message: 'Course not found' }, { status: 404 });
        }

        // 2. Verify Enrollment or Ownership
        const user = await User.findById(session.user.id);
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const courseIdStr = courseId.toString();

        // Allow Owner or Course Instructor or Admin to track progress (testing)
        const isOwner = session.user.role === 'owner' || session.user.role === 'admin';
        const isInstructor = (course.instructor as any).toString() === session.user.id;

        let isEnrolled = false;

        if (isOwner || isInstructor) {
            isEnrolled = true;
        } else {
            isEnrolled = user.enrolledCourses?.some((id: any) => {
                const enrolledId = id.toString ? id.toString() : String(id);
                return enrolledId === courseIdStr;
            });
        }

        if (!isEnrolled) {
            console.log('Progress complete: Not enrolled', {
                userId: session.user.id,
                courseId: courseIdStr
            });
            return NextResponse.json({ message: 'Not enrolled in this course' }, { status: 403 });
        }

        // 3. Get or Create Progress Record
        let progress = await Progress.findOne({ userId: session.user.id, courseId });

        if (!progress) {
            progress = await Progress.create({
                userId: session.user.id,
                courseId,
                completedLessons: [],
                percentage: 0
            });
        }

        // 4. Idempotently Add Lesson
        // Check if already completed using string comparison
        const alreadyCompletedIdx = progress.completedLessons.findIndex(
            (cl: any) => cl.lessonId.toString() === lessonId
        );

        if (alreadyCompletedIdx === -1) {
            progress.completedLessons.push({
                lessonId,
                sectionId,
                completedAt: new Date()
            });
        }

        // 5. Recalculate Percentage (Always recalculate to ensure data integrity)
        let actualTotalLessons = 0;
        if (course.sections && Array.isArray(course.sections)) {
            course.sections.forEach((section: any) => {
                if (section.lessons && Array.isArray(section.lessons)) {
                    actualTotalLessons += section.lessons.length;
                }
            });
        }

        // Fallback to model count if calculation is zero (should happen only if empty course)
        const totalLessons = actualTotalLessons > 0 ? actualTotalLessons : (course.totalLessons || 1);

        const uniqueCompletedCount = new Set(
            progress.completedLessons.map((cl: any) => cl.lessonId.toString())
        ).size;

        let newPercentage = Math.round((uniqueCompletedCount / totalLessons) * 100);

        if (newPercentage > 100) newPercentage = 100; // Hard Cap

        progress.percentage = newPercentage;
        progress.isCompleted = newPercentage === 100;
        progress.lastAccessedAt = new Date();
        progress.lastLessonId = lessonId;
        progress.lastSectionId = sectionId;

        await progress.save();

        return NextResponse.json({
            message: 'Progress updated',
            progress: {
                completedLessons: progress.completedLessons,
                percentage: progress.percentage
            }
        });

    } catch (error) {
        console.error('Progress update failed:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
