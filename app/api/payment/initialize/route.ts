import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Payment from '@/models/Payment';
import Course from '@/models/Course';
import { initializePayment } from '@/lib/paystack';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await req.json();

    if (!courseId) {
        return NextResponse.json({ message: 'Course ID required' }, { status: 400 });
    }

    await connectToDatabase();

    // Check enrollment
    const user = await User.findById(session.user.id);
    if (!user) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (user.enrolledCourses.includes(courseId)) {
        return NextResponse.json({ message: 'Already enrolled' }, { status: 400 });
    }

    const course = await Course.findById(courseId);
    if (!course) {
        return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    try {
        const callbackUrl = `${process.env.NEXTAUTH_URL}/courses/${courseId}?payment=verify`;

        // Metadata to pass to Paystack (returned in webhook)
        const metadata = {
            courseId,
            userId: session.user.id,
            custom_fields: [
                { display_name: "Course", variable_name: "course_title", value: course.title }
            ]
        };

        const paystackResponse = await initializePayment(
            session.user.email!,
            course.price,
            callbackUrl,
            metadata
        );

        // Create Pending Payment Record
        await Payment.create({
            userId: session.user.id,
            courseId: courseId,
            amount: course.price,
            paystackReference: paystackResponse.data.reference,
            status: 'pending',
            metadata
        });

        return NextResponse.json({ authorizationUrl: paystackResponse.data.authorization_url });

    } catch (error: any) {
        console.error('Payment initialization failed:', error);
        return NextResponse.json({ message: error.message || 'Payment failed' }, { status: 500 });
    }
}
