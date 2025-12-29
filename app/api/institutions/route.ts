import { NextResponse } from 'next/server';
import Institution from '@/models/Institution';
import dbConnect from '@/lib/db';

export async function GET() {
    try {
        await dbConnect();
        const institutions = await Institution.find({}).sort({ name: 1 });
        return NextResponse.json(institutions);
    } catch (error) {
        console.error('Failed to fetch institutions', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
