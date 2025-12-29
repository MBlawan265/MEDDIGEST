import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';

const registerSchema = z.object({
    fullName: z.string().min(2, 'Full name is required'),
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    whatsapp: z.string().regex(/^\d+$/, 'WhatsApp number must contain only digits').min(10, 'Invalid WhatsApp number'),
    institution: z.string().min(1, 'Institution is required'),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const result = registerSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { message: result.error.errors[0].message },
                { status: 400 }
            );
        }

        const { fullName, username, email, password, whatsapp, institution } = result.data;

        await connectToDatabase();

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email: email.toLowerCase() }, { username }],
        });

        if (existingUser) {
            if (existingUser.email === email.toLowerCase()) {
                return NextResponse.json(
                    { message: 'Email already registered' },
                    { status: 409 }
                );
            }

            // Username is taken, generate suggestions
            const suggestions: string[] = [];
            const candidates = [
                `${username}${Math.floor(Math.random() * 1000)}`,
                `${username}${new Date().getFullYear()}`,
                `${username}_mdg`
            ];

            for (const cand of candidates) {
                const check = await User.exists({ username: cand });
                if (!check) suggestions.push(cand);
            }

            return NextResponse.json(
                { message: 'Username already taken', suggestions },
                { status: 409 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        /* 
          NOTE: Default role allows normal registration to be 'student'. 
          Instructors/Admins are created manually or seeded.
        */
        const newUser = await User.create({
            fullName,
            username,
            email,
            password: hashedPassword,
            whatsapp,
            institution,
            role: 'student',
        });

        return NextResponse.json(
            { message: 'User registered successfully', userId: newUser._id },
            { status: 201 }
        );
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
