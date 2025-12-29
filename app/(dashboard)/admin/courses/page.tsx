'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaPlus, FaSearch, FaEdit, FaTrash, FaBook, FaClipboardList, FaExternalLinkAlt } from 'react-icons/fa';
import { NeuButton } from '@/components/ui/NeuButton';

interface Course {
    _id: string;
    title: string;
    description: string;
    thumbnail: string;
    price: number;
    isPublished: boolean;
    totalLessons: number;
}

interface Mcq {
    _id: string;
    title: string;
    description: string;
    thumbnail: string;
    isPublished: boolean;
    links: { buttonTitle: string; scriptUrl: string }[];
}

export default function CoursesPage() {
    const [activeTab, setActiveTab] = useState<'courses' | 'mcqs'>('courses');
    const [courses, setCourses] = useState<Course[]>([]);
    const [mcqs, setMcqs] = useState<Mcq[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (activeTab === 'courses') {
            fetchCourses();
        } else {
            fetchMcqs();
        }
    }, [activeTab]);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/courses');
            if (res.ok) {
                const data = await res.json();
                setCourses(data);
            }
        } catch (error) {
            console.error('Failed to fetch courses', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMcqs = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/mcqs');
            if (res.ok) {
                const data = await res.json();
                setMcqs(data);
            }
        } catch (error) {
            console.error('Failed to fetch MCQs', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteCourse = async (courseId: string, courseTitle: string) => {
        if (!confirm(`Are you sure you want to permanently delete "${courseTitle}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/courses/${courseId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setCourses(prev => prev.filter(c => c._id !== courseId));
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to delete course');
            }
        } catch (error) {
            console.error('Failed to delete course', error);
            alert('An error occurred while deleting the course');
        }
    };

    const deleteMcq = async (mcqId: string, mcqTitle: string) => {
        if (!confirm(`Are you sure you want to permanently delete MCQ "${mcqTitle}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/mcqs/${mcqId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setMcqs(prev => prev.filter(m => m._id !== mcqId));
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to delete MCQ');
            }
        } catch (error) {
            console.error('Failed to delete MCQ', error);
            alert('An error occurred while deleting the MCQ');
        }
    };

    const filteredCourses = courses.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredMcqs = mcqs.filter(mcq =>
        mcq.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
                    <p className="text-sm text-gray-500">Manage courses and MCQs</p>
                </div>
                <div className="flex gap-2">
                    {activeTab === 'courses' ? (
                        <Link href="/admin/courses/new">
                            <NeuButton>
                                <FaPlus className="-ml-1 mr-2 h-5 w-5" />
                                Create Course
                            </NeuButton>
                        </Link>
                    ) : (
                        <Link href="/admin/mcqs/new">
                            <NeuButton>
                                <FaPlus className="-ml-1 mr-2 h-5 w-5" />
                                Create MCQ
                            </NeuButton>
                        </Link>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('courses')}
                    className={`pb-2 px-4 text-sm font-medium transition-colors relative ${activeTab === 'courses' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <FaBook /> Courses
                    </div>
                    {activeTab === 'courses' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('mcqs')}
                    className={`pb-2 px-4 text-sm font-medium transition-colors relative ${activeTab === 'mcqs' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <FaClipboardList /> MCQs
                    </div>
                    {activeTab === 'mcqs' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />
                    )}
                </button>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="relative rounded-md shadow-sm max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <FaSearch />
                    </div>
                    <input
                        type="text"
                        className="custom-input pl-10"
                        placeholder={`Search ${activeTab}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Content List */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((n) => (
                        <div key={n} className="bg-white rounded-lg shadow-sm border border-gray-200 h-80 animate-pulse">
                            <div className="h-40 bg-gray-200 rounded-t-lg" />
                            <div className="p-4 space-y-3">
                                <div className="h-4 bg-gray-200 rounded w-3/4" />
                                <div className="h-4 bg-gray-200 rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : activeTab === 'courses' ? (
                // COURSES LIST
                filteredCourses.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                        <FaBook className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
                        <p className="mt-1 text-sm text-gray-500">Get started by creating a new course.</p>
                        <div className="mt-6">
                            <Link href="/admin/courses/new">
                                <NeuButton>
                                    <FaPlus className="-ml-1 mr-2 h-5 w-5" />
                                    New Course
                                </NeuButton>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCourses.map((course) => (
                            <div key={course._id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col overflow-hidden">
                                <div className="relative h-48 bg-gray-100">
                                    {course.thumbnail ? (
                                        <img
                                            src={course.thumbnail}
                                            alt={course.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400">
                                            <FaBook size={48} />
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${course.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {course.isPublished ? 'Published' : 'Draft'}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-4 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-bold text-gray-900 line-clamp-2" title={course.title}>
                                            {course.title}
                                        </h3>
                                    </div>

                                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{course.description}</p>

                                    <div className="mt-auto flex items-center justify-between text-sm text-gray-600 border-t pt-4">
                                        <span className="font-semibold text-blue-600">
                                            ₦{course.price.toLocaleString()}
                                        </span>
                                        <span>{course.totalLessons} Lessons</span>
                                    </div>
                                </div>

                                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-end space-x-3">
                                    <Link
                                        href={`/admin/courses/${course._id}`}
                                        className="text-gray-600 hover:text-blue-600 flex items-center text-sm font-medium transition-colors"
                                    >
                                        <FaEdit className="mr-1" /> Edit
                                    </Link>
                                    <Link
                                        href={`/courses/${course._id}`}
                                        className="text-gray-600 hover:text-blue-600 flex items-center text-sm font-medium transition-colors"
                                    >
                                        <FaBook className="mr-1" /> View
                                    </Link>
                                    <button
                                        onClick={() => deleteCourse(course._id, course.title)}
                                        className="text-red-500 hover:text-red-700 flex items-center text-sm font-medium transition-colors"
                                    >
                                        <FaTrash className="mr-1" /> Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                // MCQs LIST
                filteredMcqs.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                        <FaClipboardList className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No MCQs found</h3>
                        <p className="mt-1 text-sm text-gray-500">Get started by creating a new MCQ set.</p>
                        <div className="mt-6">
                            <Link href="/admin/mcqs/new">
                                <NeuButton>
                                    <FaPlus className="-ml-1 mr-2 h-5 w-5" />
                                    New MCQ
                                </NeuButton>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredMcqs.map((mcq) => (
                            <div key={mcq._id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col overflow-hidden">
                                <div className="relative h-48 bg-gray-100">
                                    {mcq.thumbnail ? (
                                        <img
                                            src={mcq.thumbnail}
                                            alt={mcq.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400">
                                            <FaClipboardList size={48} />
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${mcq.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {mcq.isPublished ? 'Published' : 'Draft'}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-4 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-bold text-gray-900 line-clamp-2" title={mcq.title}>
                                            {mcq.title}
                                        </h3>
                                    </div>

                                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{mcq.description}</p>

                                    <div className="mt-auto flex items-center gap-2 text-sm text-gray-600 border-t pt-4">
                                        <FaExternalLinkAlt className="text-gray-400" size={12} />
                                        <span>{mcq.links.length} Quiz Link{mcq.links.length !== 1 && 's'}</span>
                                    </div>
                                </div>

                                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-end space-x-3">
                                    <Link
                                        href={`/admin/mcqs/${mcq._id}`}
                                        className="text-gray-600 hover:text-blue-600 flex items-center text-sm font-medium transition-colors"
                                    >
                                        <FaEdit className="mr-1" /> Edit
                                    </Link>
                                    <button
                                        onClick={() => deleteMcq(mcq._id, mcq.title)}
                                        className="text-red-500 hover:text-red-700 flex items-center text-sm font-medium transition-colors"
                                    >
                                        <FaTrash className="mr-1" /> Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    );
}

