import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectToDatabase from '@/lib/db';
import Payment from '@/models/Payment';
import User from '@/models/User';
import Progress from '@/models/Progress';

export async function POST(req: Request) {
    const body = await req.json();
    const signature = req.headers.get('x-paystack-signature');

    if (!signature) {
        return NextResponse.json({ message: 'No signature' }, { status: 400 });
    }

    // Verify Signature
    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
        .update(JSON.stringify(body))
        .digest('hex');

    if (hash !== signature) {
        return NextResponse.json({ message: 'Invalid signature' }, { status: 400 });
    }

    const event = body.event;
    const data = body.data;

    if (event === 'charge.success') {
        const { reference, id: eventId, metadata } = data;
        const { courseId, userId } = metadata;

        await connectToDatabase();
        const session = await (await import('mongoose')).default.startSession();

        try {
            session.startTransaction();

            // Idempotency Check (Check if this event ID was already processed)
            // Or check if payment reference is already successful
            const existingPayment = await Payment.findOne({ paystackReference: reference }).session(session);

            if (!existingPayment) {
                // Payment record should exist from initialization, but if not (edge case?), create it?
                // Better to fail or log. We expect it to exist.
                console.error('Payment record not found for ref:', reference);
                await session.abortTransaction();
                return NextResponse.json({ message: 'Payment record not found' }, { status: 404 });
            }

            if (existingPayment.status === 'successful') {
                // Already processed
                await session.commitTransaction();
                return NextResponse.json({ message: 'Event already processed' });
            }

            // Update Payment
            existingPayment.status = 'successful';
            existingPayment.paystackEventId = eventId.toString();
            existingPayment.verifiedAt = new Date();
            await existingPayment.save({ session });

            // Unlock Course for User
            await User.findByIdAndUpdate(
                userId,
                { $addToSet: { enrolledCourses: courseId } },
                { session }
            );

            // Initialize Progress (Optional, but good for zero state)
            const existingProgress = await Progress.findOne({ userId, courseId }).session(session);
            if (!existingProgress) {
                await Progress.create([{
                    userId,
                    courseId,
                    completedLessons: [],
                    percentage: 0
                }], { session });
            }

            await session.commitTransaction();
            return NextResponse.json({ message: 'Webhook processed' });

        } catch (error) {
            await session.abortTransaction();
            console.error('Webhook processing error:', error);
            return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
        } finally {
            session.endSession();
        }
    }

    return NextResponse.json({ message: 'Event ignored' });
}
