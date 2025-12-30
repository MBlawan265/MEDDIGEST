import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(
    req: Request,
    { params }: { params: { filename: string } }
) {
    try {
        const { filename } = params;

        if (!filename) {
            return NextResponse.json({ message: 'Filename required' }, { status: 400 });
        }

        await connectToDatabase();

        const db = mongoose.connection.db;
        if (!db) {
            throw new Error('Database connection not established');
        }

        const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

        const files = await bucket.find({ filename }).toArray();

        if (!files || files.length === 0) {
            return NextResponse.json({ message: 'File not found' }, { status: 404 });
        }

        const file = files[0];
        const stream = bucket.openDownloadStreamByName(filename);

        // Create a ReadableStream from the GridFS stream
        const readableStream = new ReadableStream({
            start(controller) {
                stream.on('data', (chunk) => controller.enqueue(chunk));
                stream.on('end', () => controller.close());
                stream.on('error', (err) => controller.error(err));
            },
        });

        return new NextResponse(readableStream, {
            headers: {
                'Content-Type': file.contentType || 'application/octet-stream',
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('File retrieval error:', error);
        return NextResponse.json({ message: 'Error retrieving file' }, { status: 500 });
    }
}
