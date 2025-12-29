'use client';

import { useState, useEffect } from 'react';
import { FaSearch, FaUserPlus, FaBan, FaCheck } from 'react-icons/fa';
import { NeuButton } from '@/components/ui/NeuButton';

export default function AdminStudentsPage() {
    const [students, setStudents] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Enrollment Modal State
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [enrollModalOpen, setEnrollModalOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [studentsRes, coursesRes] = await Promise.all([
                fetch('/api/admin/actions/students'), // We need to create this endpoint
                fetch('/api/admin/courses')
            ]);

            const studentsData = await studentsRes.json();
            const coursesData = await coursesRes.json();

            if (Array.isArray(studentsData)) setStudents(studentsData);
            if (Array.isArray(coursesData)) setCourses(coursesData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async () => {
        if (!selectedStudent || !selectedCourse) return;

        try {
            const res = await fetch('/api/admin/actions/enroll', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: selectedStudent._id, courseId: selectedCourse })
            });

            if (res.ok) {
                alert('Enrolled successfully');
                setEnrollModalOpen(false);
                fetchData(); // Refresh
            }
        } catch (err) {
            alert('Enrollment failed');
        }
    };

    const filteredStudents = students.filter(s =>
        s.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groupedStudents = filteredStudents.reduce((acc: any, student) => {
        const inst = student.institution || 'No Institution';
        if (!acc[inst]) acc[inst] = [];
        acc[inst].push(student);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>

            <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex justify-between">
                <div className="relative max-w-md w-full">
                    <FaSearch className="absolute left-3 top-3 text-gray-400" />
                    <input
                        className="pl-10 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm border p-2"
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {Object.keys(groupedStudents).length === 0 ? (
                <div className="bg-white p-4 rounded-lg shadow text-center text-gray-500">
                    No students found.
                </div>
            ) : (
                Object.keys(groupedStudents).sort().map(institution => (
                    <div key={institution} className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                        <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                                {institution}
                            </h3>
                            <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded border">
                                {groupedStudents[institution].length} Student{groupedStudents[institution].length !== 1 ? 's' : ''}
                            </span>
                        </div>
                        <ul className="divide-y divide-gray-200">
                            {groupedStudents[institution].map((student: any) => (
                                <li key={student._id} className="p-4 flex flex-col sm:flex-row justify-between items-center hover:bg-gray-50">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <p className="text-sm font-medium text-blue-600">{student.username}</p>
                                            {student.isBanned && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Banned</span>}
                                        </div>
                                        <p className="text-sm text-gray-500">{student.email}</p>
                                        <p className="text-xs text-gray-400">WhatsApp: {student.whatsapp}</p>
                                        <div className="mt-1 flex flex-wrap gap-1">
                                            {student.enrolledCourses?.map((c: any) => (
                                                <span key={c._id || c} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                    Course Enrolled
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mt-4 sm:mt-0 flex space-x-2">
                                        <NeuButton
                                            onClick={() => { setSelectedStudent(student); setEnrollModalOpen(true); }}
                                            className="px-3 py-1.5 text-xs font-medium"
                                        >
                                            <FaUserPlus className="mr-1" /> Enroll
                                        </NeuButton>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))
            )}

            {/* Manual Enroll Modal */}
            {enrollModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                        <h3 className="text-lg font-bold mb-4">Enroll {selectedStudent?.username}</h3>
                        <select
                            className="block w-full border-gray-300 rounded-md shadow-sm mb-4 border p-2"
                            value={selectedCourse}
                            onChange={e => setSelectedCourse(e.target.value)}
                        >
                            <option value="">Select a course</option>
                            {courses.map(c => (
                                <option key={c._id} value={c._id}>{c.title}</option>
                            ))}
                        </select>
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => setEnrollModalOpen(false)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                            >
                                Cancel
                            </button>
                            <NeuButton
                                onClick={handleEnroll}
                            >
                                Enroll
                            </NeuButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
