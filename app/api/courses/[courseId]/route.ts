import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Course from '@/models/Course';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';

export async function GET(
    req: Request,
    { params }: { params: { courseId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        await connectToDatabase();

        console.log(`[API] Fetching course: ${params.courseId}`);
        const course = await Course.findById(params.courseId)
            .populate('instructor', 'username')
            .lean();
        console.log(`[API] Course found: ${course ? 'YES' : 'NO'}`);

        if (!course) {
            return NextResponse.json({ message: 'Course not found' }, { status: 404 });
        }

        // Check if enrolled
        let isEnrolled = false;
        let isOwner = false;

        const instructorId = (course.instructor as any)._id || course.instructor;

        if (session) {
            console.log('[API] User Role:', session.user.role);

            if (session.user.role === 'owner' || session.user.role === 'admin' || instructorId.toString() === session.user.id) {
                isOwner = true;
                console.log('[API] User granted owner access via role or ID match');
            }

            const user = await User.findById(session.user.id);
            if (user && user.enrolledCourses.some((enrolledId: any) =>
                enrolledId.toString() === (course as any)._id.toString()
            )) {
                isEnrolled = true;
            }
        }

        // If not enrolled and not owner, sanitize data (hide sensitive links)
        if (!isEnrolled && !isOwner) {
            const sanitizedCourse = { ...course };
            sanitizedCourse.sections.forEach((section: any) => {
                section.lessons.forEach((lesson: any) => {
                    if (!lesson.isPreview) {
                        lesson.youtubeUrl = ''; // Hide URL
                        lesson.driveId = ''; // Hide Drive ID
                        lesson.notes = ''; // Hide notes
                        lesson.pdfs = []; // Hide PDFs
                    }
                });
            });
            return NextResponse.json({ ...sanitizedCourse, isEnrolled: false });
        }

        return NextResponse.json({ ...course, isEnrolled: true });
    } catch (error) {
        console.error('Error fetching course:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
