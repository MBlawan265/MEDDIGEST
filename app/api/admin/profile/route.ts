import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

// GET current user profile (admin or instructor)
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Only allow admin (owner) or instructor
        if (session.user.role !== 'owner' && session.user.role !== 'instructor') {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        await connectToDatabase();
        const user = await User.findById(session.user.id).select('-password');

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error fetching profile:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

// PUT update current user profile (admin or instructor)
export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Only allow admin (owner) or instructor
        if (session.user.role !== 'owner' && session.user.role !== 'instructor') {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const data = await req.json();
        await connectToDatabase();

        const currentUser = await User.findById(session.user.id);
        if (!currentUser) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Check for uniqueness if changing username or email
        if (data.username && data.username !== currentUser.username) {
            const exists = await User.exists({ username: data.username });
            if (exists) {
                return NextResponse.json({ message: 'Username already taken' }, { status: 409 });
            }
        }

        if (data.email && data.email !== currentUser.email) {
            const exists = await User.exists({ email: data.email });
            if (exists) {
                return NextResponse.json({ message: 'Email already registered' }, { status: 409 });
            }
        }

        // Prepare update fields
        const updateFields: any = {};
        const allowedFields = ['username', 'email', 'profilePicture'];

        allowedFields.forEach(field => {
            if (data[field] !== undefined) {
                updateFields[field] = data[field];
            }
        });

        // Handle password change
        if (data.newPassword) {
            // Verify current password
            if (!data.currentPassword) {
                return NextResponse.json({ message: 'Current password is required' }, { status: 400 });
            }

            if (!currentUser.password) {
                return NextResponse.json({ message: 'User has no password set' }, { status: 400 });
            }

            const isMatch = await bcrypt.compare(data.currentPassword, currentUser.password);
            if (!isMatch) {
                return NextResponse.json({ message: 'Current password is incorrect' }, { status: 400 });
            }

            if (data.newPassword.length < 8) {
                return NextResponse.json({ message: 'New password must be at least 8 characters' }, { status: 400 });
            }

            updateFields.password = await bcrypt.hash(data.newPassword, 12);
        }

        const updatedUser = await User.findByIdAndUpdate(
            session.user.id,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).select('-password');

        return NextResponse.json(updatedUser);
    } catch (error: any) {
        console.error('Error updating profile:', error);
        if (error.code === 11000) {
            return NextResponse.json({ message: 'Username or email already exists' }, { status: 409 });
        }
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
