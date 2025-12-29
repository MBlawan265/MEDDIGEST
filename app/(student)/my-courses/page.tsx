'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaPlay, FaCheckCircle, FaBookOpen, FaShareAlt, FaWhatsapp, FaTwitter, FaCopy, FaUserMd } from 'react-icons/fa';
import { NeuCard } from '@/components/ui/NeuCard';
import { NeuButton } from '@/components/ui/NeuButton';

export default function MyCoursesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showShareModal, setShowShareModal] = useState(false);
    const [copySuccess, setCopySuccess] = useState('');

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            router.push('/login');
            return;
        }

        const fetchCourses = async () => {
            try {
                // Add timestamp to prevent caching
                const res = await fetch(`/api/student/my-courses?t=${Date.now()}`);
                if (res.ok) {
                    const data = await res.json();
                    setCourses(data.courses);
                }
            } catch (error) {
                console.error('Failed to load courses', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, [session, status, router]);

    const handleCopyLink = () => {
        const url = window.location.origin;
        navigator.clipboard.writeText(url).then(() => {
            setCopySuccess('Link copied!');
            setTimeout(() => setCopySuccess(''), 2000);
        });
    };

    const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const shareText = "I'm learning medicine on MEDDIGEST! Join me and master complex medical concepts.";

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neu-bg">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neu-bg p-6 pb-20">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header with Invite Button */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-800">My Learning</h1>
                        <p className="text-gray-600 mt-1">Track your progress and pick up where you left off.</p>
                    </div>
                    <NeuButton
                        onClick={() => setShowShareModal(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-none"
                    >
                        <FaShareAlt /> Invite Friends
                    </NeuButton>
                </div>

                {/* Course Grid */}
                {courses.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="inline-block p-6 rounded-full bg-blue-50 mb-4 shadow-neumorphism">
                            <FaBookOpen className="text-4xl text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No courses yet</h3>
                        <p className="text-gray-500 mb-6">Start your journey by enrolling in a course.</p>
                        <Link href="/">
                            <NeuButton variant="primary">Browse Courses</NeuButton>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {courses.map((course) => (
                            <NeuCard key={course._id} className="flex flex-col h-full !p-0 overflow-hidden group course-card">
                                <div className="relative aspect-video bg-gray-200 overflow-hidden">
                                    {course.thumbnail ? (
                                        <img
                                            src={course.thumbnail}
                                            alt={course.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <FaBookOpen className="text-3xl" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Link href={`/courses/${course._id}/learn`}>
                                            <button className="bg-white text-blue-600 rounded-full p-4 shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                                                <FaPlay className="pl-1 text-xl" />
                                            </button>
                                        </Link>
                                    </div>
                                </div>

                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2 min-h-[3.5rem]">
                                        {course.title}
                                    </h3>

                                    <div className="flex items-center text-sm text-gray-500 mb-4">
                                        <FaUserMd className="mr-2 text-blue-500" />
                                        <span>{course.instructor?.fullName || course.instructor?.username || 'Instructor'}</span>
                                    </div>

                                    <div className="mt-auto space-y-3">
                                        <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            <span>{course.progress || 0}% Complete</span>
                                            {course.progress === 100 && <span className="text-green-500 flex items-center"><FaCheckCircle className="mr-1" /> Done</span>}
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="bg-blue-600 h-full rounded-full transition-all duration-1000 ease-out"
                                                style={{ width: `${course.progress || 0}%` }}
                                            />
                                        </div>

                                        <Link href={`/courses/${course._id}/learn`} className="block mt-4">
                                            <NeuButton className="w-full justify-center font-bold text-sm">
                                                {course.progress > 0 ? 'Continue Learning' : 'Start Course'}
                                            </NeuButton>
                                        </Link>
                                    </div>
                                </div>
                            </NeuCard>
                        ))}
                    </div>
                )}
            </div>

            {/* Simple Share Modal Implementation */}
            {showShareModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-neu-bg/90 backdrop-blur-sm" onClick={() => setShowShareModal(false)}></div>
                    <div className="relative bg-neu-bg p-8 rounded-2xl shadow-neumorphism max-w-md w-full border border-white/50 animate-fade-in-up">
                        <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center">Invite Friends</h3>
                        <p className="text-gray-500 text-center mb-8">Share the knowledge and learn together!</p>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <a
                                href={`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center justify-center p-4 rounded-xl bg-neu-bg shadow-neumorphism-flat hover:shadow-neumorphism transition-all group"
                            >
                                <FaWhatsapp className="text-3xl text-green-500 mb-2 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-bold text-gray-700">WhatsApp</span>
                            </a>
                            <a
                                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center justify-center p-4 rounded-xl bg-neu-bg shadow-neumorphism-flat hover:shadow-neumorphism transition-all group"
                            >
                                <FaTwitter className="text-3xl text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-bold text-gray-700">Twitter / X</span>
                            </a>
                        </div>

                        <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-100 shadow-inner">
                            <input
                                type="text"
                                readOnly
                                value={shareUrl}
                                className="bg-transparent border-none text-gray-600 text-sm w-full focus:ring-0"
                            />
                            <button
                                onClick={handleCopyLink}
                                className="text-blue-600 hover:text-blue-700 p-2"
                            >
                                <FaCopy />
                            </button>
                        </div>
                        {copySuccess && <p className="text-green-500 text-xs text-center mt-2 font-bold">{copySuccess}</p>}

                        <button
                            onClick={() => setShowShareModal(false)}
                            className="mt-6 w-full py-3 text-gray-500 font-bold hover:text-gray-800 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
