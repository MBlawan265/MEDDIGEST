import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Payment from '@/models/Payment';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'owner') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        // Aggregate total earnings from successful payments
        const result = await Payment.aggregate([
            { $match: { status: 'successful' } },
            { $group: { _id: null, totalEarnings: { $sum: '$amount' } } }
        ]);

        const totalEarnings = result.length > 0 ? result[0].totalEarnings : 0;

        return NextResponse.json({ totalEarnings });
    } catch (error) {
        console.error('Error calculating earnings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch earnings' },
            { status: 500 }
        );
    }
}
