import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Course from '@/models/Course';

export const dynamic = 'force-dynamic';

export async function GET(
    req: Request,
    { params }: { params: { courseId: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { courseId } = params;
        await connectToDatabase();

        const course = await Course.findById(courseId);

        if (!course) {
            return NextResponse.json({ message: 'Course not found' }, { status: 404 });
        }

        // RBAC Check
        if (session.user.role === 'instructor' && course.instructor.toString() !== session.user.id) {
            return NextResponse.json({ message: 'Unauthorized access to this course' }, { status: 403 });
        }

        return NextResponse.json(course);
    } catch (error) {
        console.error('Error fetching course:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: { params: { courseId: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || (session.user.role !== 'owner' && session.user.role !== 'instructor')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { courseId } = params;
        const updateData = await req.json();

        await connectToDatabase();

        const course = await Course.findById(courseId);

        if (!course) {
            return NextResponse.json({ message: 'Course not found' }, { status: 404 });
        }

        // RBAC Check
        if (session.user.role === 'instructor' && course.instructor.toString() !== session.user.id) {
            return NextResponse.json({ message: 'Unauthorized update attempt' }, { status: 403 });
        }

        // Update fields
        const updatedCourse = await Course.findByIdAndUpdate(
            courseId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        return NextResponse.json(updatedCourse);
    } catch (error) {
        console.error('Error updating course:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { courseId: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || (session.user.role !== 'owner' && session.user.role !== 'instructor')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { courseId } = params;
        await connectToDatabase();

        const course = await Course.findById(courseId);

        if (!course) {
            return NextResponse.json({ message: 'Course not found' }, { status: 404 });
        }

        // RBAC Check
        if (session.user.role === 'instructor' && course.instructor.toString() !== session.user.id) {
            return NextResponse.json({ message: 'Unauthorized delete attempt' }, { status: 403 });
        }

        await Course.findByIdAndDelete(courseId);

        return NextResponse.json({ message: 'Course deleted successfully' });
    } catch (error) {
        console.error('Error deleting course:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
