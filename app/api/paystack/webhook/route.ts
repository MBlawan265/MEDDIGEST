import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectToDatabase from '@/lib/db';
import Payment from '@/models/Payment';
import User from '@/models/User';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const signature = req.headers.get('x-paystack-signature');

        if (!signature) {
            return NextResponse.json({ error: 'No signature' }, { status: 400 });
        }

        // Verify signature
        const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
            .update(JSON.stringify(body))
            .digest('hex');

        if (hash !== signature) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const event = body.event;
        const data = body.data;

        if (event === 'charge.success') {
            await connectToDatabase();

            const reference = data.reference;
            const payment = await Payment.findOne({ paystackReference: reference });

            if (!payment) {
                console.error(`Payment not found for reference: ${reference}`);
                return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
            }

            if (payment.status === 'successful') {
                return NextResponse.json({ message: 'Payment already processed' });
            }

            // Update payment status
            payment.status = 'successful';
            payment.verifiedAt = new Date();
            payment.metadata = { ...payment.metadata, paystackData: data };
            await payment.save();

            // Enroll user
            const userId = payment.userId;
            const courseId = payment.courseId;

            await User.findByIdAndUpdate(userId, {
                $addToSet: { enrolledCourses: courseId }
            });

            console.log(`Payment successful for user ${userId}, course ${courseId}`);
        }

        return NextResponse.json({ message: 'Webhook received' });

    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
