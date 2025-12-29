'use client';

import { signOut } from 'next-auth/react';
import { NeuButton } from '@/components/ui/NeuButton';
import Link from 'next/link';
import { FaUserCircle } from 'react-icons/fa';

interface UserMenuProps {
    user: {
        name?: string | null;
        email?: string | null;
        role?: string;
    };
}

export default function UserMenu({ user }: UserMenuProps) {
    return (
        <div className="flex items-center space-x-4">
            <div className="flex items-center text-gray-700">
                <FaUserCircle className="mr-2 text-xl text-blue-600" />
                <span className="font-medium">{user.name || user.email}</span>
            </div>

            {(user.role === 'owner' || user.role === 'admin') && (
                <Link href="/admin">
                    <NeuButton className="bg-blue-600 text-white">Admin Dashboard</NeuButton>
                </Link>
            )}

            {user.role === 'instructor' && (
                <Link href="/instructor/courses">
                    <NeuButton className="bg-blue-600 text-white">Instructor Dashboard</NeuButton>
                </Link>
            )}

            {/* Student Links */}
            <Link href="/my-courses">
                <button className="text-sm font-bold text-blue-600 hover:text-blue-800 mr-4 transition-colors">
                    My Learning
                </button>
            </Link>

            <Link href="/profile">
                <button className="text-sm font-medium text-gray-700 hover:text-blue-600 mr-2">
                    Profile
                </button>
            </Link>

            <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-sm text-gray-500 hover:text-gray-900 font-medium"
            >
                Sign Out
            </button>
        </div>
    );
}
