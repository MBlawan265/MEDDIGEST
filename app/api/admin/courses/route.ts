import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Course from '@/models/Course';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        let query = {};

        // RBAC: Instructors can only see their own courses. 
        // Owners/Admins can see all.
        // Assuming 'owner' is the admin role.
        if (session.user.role === 'instructor') {
            query = { instructor: session.user.id };
        }

        const courses = await Course.find(query)
            .populate('instructor', 'username email')
            .sort({ createdAt: -1 });

        return NextResponse.json(courses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || (session.user.role !== 'owner' && session.user.role !== 'instructor')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { title, description, price, thumbnail } = body;

        // Initial validation
        if (!title || !description || price === undefined || !thumbnail) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        await connectToDatabase();

        const newCourse = await Course.create({
            title,
            description,
            price,
            thumbnail,
            instructor: session.user.id, // Current user is the instructor/creator
            sections: [], // Initialize with empty sections
            isPublished: false,
        });

        return NextResponse.json(newCourse, { status: 201 });
    } catch (error) {
        console.error('Error creating course:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
