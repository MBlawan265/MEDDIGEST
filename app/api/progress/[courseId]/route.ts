import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Progress from '@/models/Progress';

export const dynamic = 'force-dynamic';

export async function GET(
    req: Request,
    { params }: { params: { courseId: string } }
) {
    const session = await getServerSession(authOptions);

    // Extract courseId from URL if using dynamic route file convention, 
    // but here we might need to parse it if this file is [...params] or similar.
    // Assuming directory is app/api/progress/[courseId]/route.ts
    // The params object is injected by Next.js

    /* 
      FIX: In previous file creation, I named it /complete. 
      This file needs to be in [courseId] folder.
    */

    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = params;

    try {
        await connectToDatabase();

        let progress = await Progress.findOne({
            userId: session.user.id,
            courseId
        });

        if (!progress) {
            // Return empty progress structure instead of 404 to simplify frontend logic
            return NextResponse.json({
                completedLessons: [],
                lessonProgress: [],
                percentage: 0,
                isCompleted: false,
                lastLessonId: null,
                lastSectionId: null,
                lastPlaybackTime: 0
            });
        }

        return NextResponse.json({
            completedLessons: progress.completedLessons || [],
            lessonProgress: progress.lessonProgress || [],
            percentage: progress.percentage || 0,
            isCompleted: progress.isCompleted || false,
            lastLessonId: progress.lastLessonId || null,
            lastSectionId: progress.lastSectionId || null,
            lastPlaybackTime: progress.lastPlaybackTime || 0
        });
    } catch (error) {
        console.error('Error fetching progress:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
