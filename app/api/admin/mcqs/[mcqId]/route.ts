import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Mcq from '@/models/MCQ';
import { UserRole } from '@/models/User';

export const dynamic = 'force-dynamic';

// GET single MCQ
export async function GET(
    req: Request,
    { params }: { params: { mcqId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== UserRole.OWNER) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const mcq = await Mcq.findById(params.mcqId);

        if (!mcq) {
            return NextResponse.json({ message: 'MCQ not found' }, { status: 404 });
        }

        return NextResponse.json(mcq);
    } catch (error) {
        console.error('Error fetching MCQ:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

// PUT update MCQ
export async function PUT(
    req: Request,
    { params }: { params: { mcqId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== UserRole.OWNER) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const data = await req.json();
        await connectToDatabase();

        const updatedMcq = await Mcq.findByIdAndUpdate(
            params.mcqId,
            { ...data },
            { new: true, runValidators: true }
        );

        if (!updatedMcq) {
            return NextResponse.json({ message: 'MCQ not found' }, { status: 404 });
        }

        return NextResponse.json(updatedMcq);
    } catch (error) {
        console.error('Error updating MCQ:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

// DELETE MCQ
export async function DELETE(
    req: Request,
    { params }: { params: { mcqId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== UserRole.OWNER) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const deletedMcq = await Mcq.findByIdAndDelete(params.mcqId);

        if (!deletedMcq) {
            return NextResponse.json({ message: 'MCQ not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'MCQ deleted successfully' });
    } catch (error) {
        console.error('Error deleting MCQ:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
