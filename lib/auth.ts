import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                identifier: { label: 'Email or Username', type: 'text' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.identifier || !credentials?.password) {
                    throw new Error('Please enter your email/username and password');
                }

                await connectToDatabase();

                // Allow login with either email or username
                const user = await User.findOne({
                    $or: [
                        { email: credentials.identifier.toLowerCase() },
                        { username: credentials.identifier }
                    ]
                });

                if (!user) {
                    throw new Error('Invalid credentials');
                }

                if (user.isBanned) {
                    throw new Error('This account has been banned. Please contact support.');
                }

                const isPasswordCorrect = await bcrypt.compare(
                    credentials.password,
                    user.password!
                );

                if (!isPasswordCorrect) {
                    throw new Error('Invalid credentials');
                }

                return {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.username,
                    role: user.role,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.name = user.name;
            }

            // Allow updating session data
            if (trigger === 'update' && session) {
                return { ...token, ...session.user };
            }

            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.name = token.name;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    secret: process.env.NEXTAUTH_SECRET,
};
