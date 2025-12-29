import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Mcq from '@/models/MCQ';

// GET single published MCQ
export async function GET(
    req: Request,
    { params }: { params: { mcqId: string } }
) {
    try {
        await connectToDatabase();

        const mcq = await Mcq.findOne({
            _id: params.mcqId,
            isPublished: true
        }).select('title description thumbnail links isPublished createdAt');

        if (!mcq) {
            return NextResponse.json({ message: 'MCQ not found' }, { status: 404 });
        }

        return NextResponse.json(mcq);
    } catch (error) {
        console.error('Error fetching public MCQ:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
