'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { NeuButton } from '@/components/ui/NeuButton';
import Link from 'next/link';
import { FaUserCircle, FaBars, FaTimes } from 'react-icons/fa';

interface UserMenuProps {
    user: {
        name?: string | null;
        email?: string | null;
        role?: string;
    };
}

export default function UserMenu({ user }: UserMenuProps) {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => setIsOpen(!isOpen);

    const isAdmin = user.role === 'owner' || user.role === 'admin';
    const isInstructor = user.role === 'instructor';

    return (
        <div className="relative">
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-4">
                <div className="flex items-center text-gray-700">
                    <FaUserCircle className="mr-2 text-xl text-blue-600" />
                    <span className="font-medium">{user.name || user.email}</span>
                </div>

                {isAdmin && (
                    <Link href="/admin">
                        <NeuButton className="bg-blue-600 text-white">Admin Dashboard</NeuButton>
                    </Link>
                )}

                {isInstructor && (
                    <Link href="/instructor/courses">
                        <NeuButton className="bg-blue-600 text-white">Instructor Dashboard</NeuButton>
                    </Link>
                )}

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

            {/* Mobile Hamburger */}
            <div className="md:hidden flex items-center gap-4">
                <div className="flex items-center text-gray-700 mr-2">
                    <FaUserCircle className="mr-2 text-xl text-blue-600" />
                    <span className="font-medium max-w-[100px] truncate">{user.name || user.email}</span>
                </div>
                <button
                    onClick={toggleMenu}
                    className="text-gray-600 hover:text-blue-600 focus:outline-none p-2"
                >
                    {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                </button>
            </div>

            {/* Mobile Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl shadow-neumorphism bg-neu-bg z-50 p-4 flex flex-col space-y-4 md:hidden border border-white/50">
                    {isAdmin && (
                        <Link href="/admin" onClick={toggleMenu}>
                            <NeuButton className="w-full bg-blue-600 text-white text-sm">Admin Dashboard</NeuButton>
                        </Link>
                    )}

                    {isInstructor && (
                        <Link href="/instructor/courses" onClick={toggleMenu}>
                            <NeuButton className="w-full bg-blue-600 text-white text-sm">Instructor Dashboard</NeuButton>
                        </Link>
                    )}

                    <Link href="/my-courses" onClick={toggleMenu} className="block w-full">
                        <div className="flex items-center space-x-2 text-blue-600 font-bold p-2 hover:bg-gray-100 rounded-lg">
                            <span>My Learning</span>
                        </div>
                    </Link>

                    <Link href="/profile" onClick={toggleMenu} className="block w-full">
                        <div className="flex items-center space-x-2 text-gray-700 font-medium p-2 hover:bg-gray-100 rounded-lg">
                            <span>Profile</span>
                        </div>
                    </Link>

                    <div className="border-t border-gray-200 pt-2">
                        <button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className="w-full text-left p-2 text-gray-500 hover:text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
