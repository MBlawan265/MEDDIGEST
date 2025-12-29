'use client';

import { useState, useEffect } from 'react';
import { FaSearch, FaUserTie, FaPlus, FaTimes, FaEnvelope, FaUser, FaLock } from 'react-icons/fa';
import { NeuButton } from '@/components/ui/NeuButton';
import { NeuInput } from '@/components/ui/NeuInput';
import { NeuCard } from '@/components/ui/NeuCard';

export default function AdminInstructorsPage() {
    const [instructors, setInstructors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [newInstructor, setNewInstructor] = useState({
        username: '',
        email: '',
        password: '',
    });

    useEffect(() => {
        fetchInstructors();
    }, []);

    const fetchInstructors = async () => {
        try {
            const res = await fetch('/api/admin/instructors');
            if (res.ok) {
                const data = await res.json();
                setInstructors(data);
            }
        } catch (error) {
            console.error('Failed to fetch instructors', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewInstructor({ ...newInstructor, [e.target.name]: e.target.value });
    };

    const handleCreateInstructor = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setError('');

        try {
            const res = await fetch('/api/admin/instructors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newInstructor),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create instructor');
            }

            // Add to list
            setInstructors(prev => [data, ...prev]);
            setNewInstructor({ username: '', email: '', password: '' });
            setShowModal(false);
            setSuccess('Instructor created successfully');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setCreating(false);
        }
    };

    const filteredInstructors = instructors.filter(instructor =>
        instructor.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instructor.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Instructor Management</h1>
                <NeuButton onClick={() => setShowModal(true)} variant="primary">
                    <FaPlus className="mr-2" /> Add Instructor
                </NeuButton>
            </div>

            {success && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 text-green-700 rounded-r-lg">
                    {success}
                </div>
            )}

            <NeuCard className="p-4">
                <div className="relative max-w-md w-full">
                    <NeuInput
                        placeholder="Search instructors..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        icon={<FaSearch />}
                    />
                </div>
            </NeuCard>

            <NeuCard className="!p-0 overflow-hidden">
                <ul className="divide-y divide-gray-100">
                    {loading ? (
                        <li className="p-6 text-center text-gray-500">Loading...</li>
                    ) : filteredInstructors.length === 0 ? (
                        <li className="p-6 text-center text-gray-500">
                            No instructors found. Click "Add Instructor" to create one.
                        </li>
                    ) : (
                        filteredInstructors.map(instructor => (
                            <li key={instructor._id} className="p-4 flex flex-col sm:flex-row justify-between items-center hover:bg-gray-50 transition-colors">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                                        {instructor.profilePicture ? (
                                            <img src={instructor.profilePicture} alt="" className="h-full w-full rounded-full object-cover" />
                                        ) : (
                                            <FaUserTie size={20} />
                                        )}
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-bold text-gray-800">{instructor.username}</p>
                                        <p className="text-sm text-gray-500">{instructor.email}</p>
                                        <p className="text-xs text-gray-400">Joined: {new Date(instructor.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="mt-4 sm:mt-0">
                                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${!instructor.isBanned ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {instructor.isBanned ? 'Banned' : 'Active'}
                                    </span>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </NeuCard>

            {/* Add Instructor Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
                        <div
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                            onClick={() => setShowModal(false)}
                        />

                        <div className="inline-block bg-neu-bg rounded-2xl text-left overflow-hidden shadow-neumorphism transform transition-all sm:my-8 sm:max-w-lg sm:w-full p-8 relative z-10">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-800">Add New Instructor</h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <FaTimes size={20} />
                                </button>
                            </div>

                            {error && (
                                <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 text-red-700 text-sm rounded-r-lg">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleCreateInstructor} className="space-y-5">
                                <NeuInput
                                    label="Username"
                                    name="username"
                                    value={newInstructor.username}
                                    onChange={handleInputChange}
                                    icon={<FaUser />}
                                    required
                                    placeholder="instructor_name"
                                />

                                <NeuInput
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={newInstructor.email}
                                    onChange={handleInputChange}
                                    icon={<FaEnvelope />}
                                    required
                                    placeholder="instructor@example.com"
                                />

                                <NeuInput
                                    label="Password"
                                    name="password"
                                    type="password"
                                    value={newInstructor.password}
                                    onChange={handleInputChange}
                                    icon={<FaLock />}
                                    required
                                    placeholder="Min 8 characters"
                                />

                                <div className="flex justify-end space-x-3 pt-4">
                                    <NeuButton
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        variant="secondary"
                                    >
                                        Cancel
                                    </NeuButton>
                                    <NeuButton
                                        type="submit"
                                        isLoading={creating}
                                        variant="primary"
                                    >
                                        Create Instructor
                                    </NeuButton>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
