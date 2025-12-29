import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const user = await User.findById(session.user.id).select('-password');

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const data = await req.json();

        await connectToDatabase();

        // Check for uniqueness if changing username or email
        if (data.username || data.email) {
            // Find current user to compare
            const currentUser = await User.findById(session.user.id);
            if (!currentUser) return NextResponse.json({ message: 'User not found' }, { status: 404 });

            if (data.username && data.username !== currentUser.username) {
                const exists = await User.exists({ username: data.username });
                if (exists) return NextResponse.json({ message: 'Username already taken' }, { status: 409 });
            }

            if (data.email && data.email !== currentUser.email) {
                const exists = await User.exists({ email: data.email });
                if (exists) return NextResponse.json({ message: 'Email already registered' }, { status: 409 });
            }
        }

        // Prepare update fields
        const updateFields: any = {};
        const allowedFields = ['fullName', 'username', 'email', 'whatsapp', 'bio', 'profilePicture'];

        allowedFields.forEach(field => {
            if (data[field] !== undefined) {
                updateFields[field] = data[field];
            }
        });

        // Prevent updating institution
        delete updateFields.institution;

        const updatedUser = await User.findByIdAndUpdate(
            session.user.id,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).select('-password');

        return NextResponse.json(updatedUser);
    } catch (error: any) {
        // Handle duplicate key error from Mongo just in case race condition
        if (error.code === 11000) {
            return NextResponse.json({ message: 'Username or email already exists' }, { status: 409 });
        }
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
