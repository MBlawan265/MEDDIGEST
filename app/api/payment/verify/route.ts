import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Enrollment from '@/models/Enrollment';
import Payment from '@/models/Payment';
import Course from '@/models/Course';
import User from '@/models/User';
import { verifyPayment } from '@/lib/paystack';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { reference } = await req.json();

    if (!reference) {
        return NextResponse.json({ message: 'Reference required' }, { status: 400 });
    }

    try {
        await connectToDatabase();

        // 1. Verify with Paystack
        const paystackData = await verifyPayment(reference);

        if (paystackData.data.status !== 'success') {
            return NextResponse.json({ message: 'Payment verification failed at provider' }, { status: 400 });
        }

        // 2. Find Payment Record
        const payment = await Payment.findOne({ paystackReference: reference });

        if (!payment) {
            return NextResponse.json({ message: 'Payment record not found' }, { status: 404 });
        }

        if (payment.status === 'successful') {
            return NextResponse.json({ message: 'Payment already verified', status: 'success' });
        }

        // 3. Update Payment Status
        payment.status = 'successful';
        // payment.paidAt = new Date(); // Removed as it likely doesn't exist in schema
        await payment.save();

        // 4. Enroll User (Create Enrollment Record)
        const { courseId, userId } = payment;

        // Idempotently create enrollment
        await Enrollment.findOneAndUpdate(
            { userId, courseId },
            {
                userId,
                courseId,
                enrollmentType: 'purchase',
                status: 'active'
            },
            { upsert: true, new: true }
        );

        // Sync with User model for performance
        await User.findByIdAndUpdate(userId, {
            $addToSet: { enrolledCourses: courseId }
        });

        // 5. Update Course Enrollment Count
        // ...
        await Course.findByIdAndUpdate(courseId, {
            $inc: { enrolledCount: 1 }
        });

        return NextResponse.json({ message: 'Payment verified and user enrolled', status: 'success' });

    } catch (error: any) {
        console.error('Verification Error:', error);
        return NextResponse.json({ message: error.message || 'Internal Error' }, { status: 500 });
    }
}
