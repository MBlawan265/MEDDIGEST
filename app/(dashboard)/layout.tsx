'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    FaChartLine,
    FaBook,
    FaUsers,
    FaChalkboardTeacher,
    FaCog,
    FaSignOutAlt,
    FaBars,
    FaTimes,
    FaSearch
} from 'react-icons/fa';
import { useState } from 'react';
import { NeuInput } from '@/components/ui/NeuInput';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();

    const role = session?.user?.role;

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const navigation = [
        // Admin Only Links
        ...(role === 'owner' ? [
            { name: 'Overview', href: '/admin', icon: FaChartLine },
            { name: 'Students', href: '/admin/students', icon: FaUsers },
            { name: 'Instructors', href: '/admin/instructors', icon: FaChalkboardTeacher },
        ] : []),

        // Shared Links (Admin + Instructor)
        ...(role === 'owner' || role === 'instructor' ? [
            { name: 'My Courses', href: '/admin/courses', icon: FaBook },
        ] : []),

        // Common Links
        { name: 'Settings', href: '/admin/settings', icon: FaCog },
    ];

    return (
        <div className="min-h-screen bg-neu-bg flex text-gray-700 font-sans">
            {/* Mobile Sidebar Backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-20 bg-gray-900/20 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 z-30 w-72 bg-neu-bg text-gray-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
                border-r border-white/50 shadow-neumorphism
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex items-center justify-between h-20 px-6">
                    <Link href="/" className="text-2xl font-extrabold tracking-tight text-blue-600 flex items-center gap-2">
                        MEDDIGEST
                    </Link>
                    <button onClick={toggleSidebar} className="lg:hidden text-gray-500 hover:text-blue-600 transition-colors">
                        <FaTimes size={24} />
                    </button>
                </div>

                <div className="px-6 py-6 space-y-8">
                    {/* User Profile Snippet */}
                    <div className="flex items-center space-x-4 p-4 rounded-2xl shadow-neumorphism bg-neu-bg">
                        <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold shadow-neumorphism-inset">
                            {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-gray-800 truncate">{session?.user?.name}</p>
                            <p className="text-xs text-gray-500 font-medium bg-gray-200/50 px-2 py-0.5 rounded-full inline-block mt-1 capitalize">
                                {role}
                            </p>
                        </div>
                    </div>

                    {/* Search Bar (Visual Only for now, consistent with UI request) */}
                    <div className="relative">
                        <NeuInput
                            placeholder="Search..."
                            icon={<FaSearch className="text-gray-400" />}
                            className="!py-2.5 !text-sm"
                        />
                    </div>

                    <nav className="space-y-3">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`
                                        flex items-center px-5 py-3.5 text-sm font-bold rounded-xl transition-all duration-300
                                        ${isActive
                                            ? 'text-blue-600 shadow-neumorphism bg-neu-bg'
                                            : 'text-gray-500 hover:text-blue-600 hover:shadow-neumorphism-hover bg-neu-bg/50'}
                                    `}
                                >
                                    <item.icon className={`mr-4 h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="absolute bottom-0 w-full p-6">
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="flex items-center justify-center w-full px-4 py-3 text-sm font-bold text-gray-500 rounded-xl hover:text-red-500 hover:shadow-neumorphism transition-all duration-300 bg-neu-bg"
                    >
                        <FaSignOutAlt className="mr-3 h-5 w-5" />
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden bg-neu-bg relative z-0">
                {/* Mobile Header */}
                <header className="lg:hidden bg-neu-bg shadow-sm z-10 px-4 h-16 flex items-center justify-between border-b border-white/50">
                    <button
                        onClick={toggleSidebar}
                        className="text-gray-500 focus:outline-none p-2 rounded-lg active:shadow-neumorphism-inset transition-all"
                    >
                        <FaBars size={24} />
                    </button>
                    <span className="text-lg font-bold text-gray-700">Dashboard</span>
                    <div className="w-6" />
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
