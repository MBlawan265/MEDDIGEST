import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = Date.now() + '_' + file.name.replaceAll(' ', '_');

        // Ensure filename is safe
        const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '');

        const uploadDir = path.join(process.cwd(), 'public/uploads');
        const filePath = path.join(uploadDir, safeFilename);

        await writeFile(filePath, buffer);

        const fileUrl = `/uploads/${safeFilename}`;

        return NextResponse.json({ url: fileUrl, filename: safeFilename });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ message: 'Upload failed' }, { status: 500 });
    }
}
