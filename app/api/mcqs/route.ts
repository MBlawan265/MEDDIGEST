import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Mcq from '@/models/MCQ';

// GET all published MCQs
export async function GET(req: Request) {
    try {
        await connectToDatabase();

        // Only fetch published MCQs
        const mcqs = await Mcq.find({ isPublished: true })
            .select('title description thumbnail links isPublished createdAt')
            .sort({ createdAt: -1 });

        return NextResponse.json(mcqs);
    } catch (error) {
        console.error('Error fetching public MCQs:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
