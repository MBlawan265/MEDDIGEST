'use client';

import { useState, useEffect } from 'react';
import { FaBook, FaChalkboardTeacher, FaUsers, FaMoneyBillWave } from 'react-icons/fa';

export default function AdminDashboardPage() {
    const [counts, setCounts] = useState({
        courses: 0,
        instructors: 0,
        students: 0,
        earnings: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [coursesRes, instructorsRes, studentsRes, earningsRes] = await Promise.all([
                fetch('/api/admin/courses'),
                fetch('/api/admin/instructors'),
                fetch('/api/admin/actions/students'),
                fetch('/api/admin/earnings')
            ]);

            const coursesData = coursesRes.ok ? await coursesRes.json() : [];
            const instructorsData = instructorsRes.ok ? await instructorsRes.json() : [];
            const studentsData = studentsRes.ok ? await studentsRes.json() : [];
            const earningsData = earningsRes.ok ? await earningsRes.json() : { totalEarnings: 0 };

            setCounts({
                courses: Array.isArray(coursesData) ? coursesData.length : 0,
                instructors: Array.isArray(instructorsData) ? instructorsData.length : 0,
                students: Array.isArray(studentsData) ? studentsData.length : 0,
                earnings: earningsData.totalEarnings || 0,
            });
        } catch (error) {
            console.error('Failed to fetch dashboard stats', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {/* Earnings Card */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="rounded-md bg-green-600 p-3">
                                    <FaMoneyBillWave className="h-6 w-6 text-white" />
                                </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total Earnings</dt>
                                    <dd>
                                        <div className="text-lg font-medium text-gray-900">
                                            {loading ? '...' : `₦${counts.earnings.toLocaleString()}`}
                                        </div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Courses Card */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="rounded-md bg-blue-500 p-3">
                                    <FaBook className="h-6 w-6 text-white" />
                                </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total Courses</dt>
                                    <dd>
                                        <div className="text-lg font-medium text-gray-900">
                                            {loading ? '...' : counts.courses}
                                        </div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Instructors Card */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="rounded-md bg-yellow-500 p-3">
                                    <FaChalkboardTeacher className="h-6 w-6 text-white" />
                                </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total Instructors</dt>
                                    <dd>
                                        <div className="text-lg font-medium text-gray-900">
                                            {loading ? '...' : counts.instructors}
                                        </div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Students Card */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="rounded-md bg-purple-500 p-3">
                                    <FaUsers className="h-6 w-6 text-white" />
                                </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total Students</dt>
                                    <dd>
                                        <div className="text-lg font-medium text-gray-900">
                                            {loading ? '...' : counts.students}
                                        </div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
