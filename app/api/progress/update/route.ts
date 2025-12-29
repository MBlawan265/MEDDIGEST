import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Progress from '@/models/Progress';
import Course from '@/models/Course';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

// POST - Update playback position and per-lesson progress
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { courseId, lessonId, sectionId, watchedSeconds, totalDuration } = await req.json();

    if (!courseId || !lessonId || !sectionId) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    try {
        await connectToDatabase();

        // Verify enrollment
        const user = await User.findById(session.user.id);
        if (!user) {
            console.log('Progress update: User not found', session.user.id);
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Check enrollment - normalize both to strings
        const courseIdStr = courseId.toString();
        const isEnrolled = user.enrolledCourses?.some((id: any) => {
            const enrolledId = id.toString ? id.toString() : String(id);
            return enrolledId === courseIdStr;
        });

        if (!isEnrolled) {
            console.log('Progress update: Not enrolled', {
                userId: session.user.id,
                courseId: courseIdStr,
                enrolledCourses: user.enrolledCourses?.map((id: any) => id.toString())
            });
            return NextResponse.json({ message: 'Not enrolled in this course' }, { status: 403 });
        }

        // Get course to know total lessons
        const course = await Course.findById(courseId);
        if (!course) {
            return NextResponse.json({ message: 'Course not found' }, { status: 404 });
        }

        const totalLessons = course.totalLessons || 1;

        // Get or create progress
        let progress = await Progress.findOne({ userId: session.user.id, courseId });

        if (!progress) {
            progress = await Progress.create({
                userId: session.user.id,
                courseId,
                completedLessons: [],
                lessonProgress: [],
                percentage: 0
            });
        }

        // Update per-lesson progress
        const lessonProgressIndex = progress.lessonProgress.findIndex(
            (lp: any) => lp.lessonId.toString() === lessonId
        );

        const watchedSecs = watchedSeconds || 0;
        const totalDur = totalDuration || watchedSecs || 1;

        // Auto-complete logic: 90% watched or more
        const isAutoComplete = watchedSecs >= totalDur * 0.9;

        if (lessonProgressIndex >= 0) {
            // Update existing lesson progress
            progress.lessonProgress[lessonProgressIndex].watchedSeconds = watchedSecs;
            progress.lessonProgress[lessonProgressIndex].totalDuration = totalDur;
            if (isAutoComplete && !progress.lessonProgress[lessonProgressIndex].completed) {
                progress.lessonProgress[lessonProgressIndex].completed = true;
                progress.lessonProgress[lessonProgressIndex].completedAt = new Date();

                // Also add to completedLessons if not already there
                const alreadyInCompleted = progress.completedLessons.some(
                    (cl: any) => cl.lessonId.toString() === lessonId
                );
                if (!alreadyInCompleted) {
                    progress.completedLessons.push({
                        lessonId,
                        sectionId,
                        completedAt: new Date()
                    });
                }
            }
        } else {
            // Add new lesson progress
            progress.lessonProgress.push({
                lessonId,
                sectionId,
                watchedSeconds: watchedSecs,
                totalDuration: totalDur,
                completed: isAutoComplete,
                completedAt: isAutoComplete ? new Date() : undefined
            });

            // Auto-complete: add to completedLessons
            if (isAutoComplete) {
                progress.completedLessons.push({
                    lessonId,
                    sectionId,
                    completedAt: new Date()
                });
            }
        }

        // Update last position for resume
        progress.lastLessonId = lessonId;
        progress.lastSectionId = sectionId;
        progress.lastPlaybackTime = watchedSecs;
        progress.lastAccessedAt = new Date();

        // Recalculate percentage
        const completedCount = progress.completedLessons.length;
        progress.percentage = Math.round((completedCount / totalLessons) * 100);
        if (progress.percentage > 100) progress.percentage = 100;
        progress.isCompleted = progress.percentage === 100;

        await progress.save();

        return NextResponse.json({
            message: 'Progress saved',
            lessonProgress: progress.lessonProgress,
            completedLessons: progress.completedLessons,
            percentage: progress.percentage,
            isCompleted: progress.isCompleted,
            lastLessonId: progress.lastLessonId,
            lastPlaybackTime: progress.lastPlaybackTime
        });

    } catch (error) {
        console.error('Error updating progress:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
