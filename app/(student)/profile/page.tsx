'use client';
import Link from 'next/link';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { NeuButton } from '@/components/ui/NeuButton';
import { NeuInput } from '@/components/ui/NeuInput';
import { NeuCard } from '@/components/ui/NeuCard';
import { FaUserCircle, FaEnvelope, FaWhatsapp, FaUniversity, FaCamera, FaUser } from 'react-icons/fa';

export default function StudentProfilePage() {
    const { data: session, update: updateSession } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        whatsapp: '',
        institution: '',
        bio: '',
        profilePicture: '',
    });

    useEffect(() => {
        if (session?.user) {
            fetchProfile();
        } else if (session === null) {
            router.push('/login');
        }
    }, [session]);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/student/profile');
            if (res.ok) {
                const data = await res.json();
                setFormData({
                    fullName: data.fullName || '',
                    username: data.username || '',
                    email: data.email || '',
                    whatsapp: data.whatsapp || '',
                    institution: data.institution || '',
                    bio: data.bio || '',
                    profilePicture: data.profilePicture || '',
                });
            } else {
                throw new Error('Failed to fetch profile');
            }
        } catch (err) {
            setError('Could not load profile data');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        const uploadData = new FormData();
        uploadData.set('file', file);

        setSaving(true);
        try {
            const res = await fetch('/api/upload', { method: 'POST', body: uploadData });
            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();
            setFormData(prev => ({ ...prev, profilePicture: data.url }));
            setSuccess('Photo uploaded. Remember to save changes.');
        } catch (err) {
            setError('Failed to upload image');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch('/api/student/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to update profile');
            }

            if (formData.username !== session?.user?.name) {
                await updateSession({ name: formData.username });
            }

            setSuccess('Profile updated successfully');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-neu-bg">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-neu-bg py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <NeuCard className="overflow-visible pb-12">
                    {/* Header Banner - kept flat/blue for brand, but could be soft */}
                    <div className="h-40 sm:h-52 bg-gradient-to-r from-blue-600 to-blue-800 rounded-t-xl -mx-6 -mt-6 mb-16 relative shadow-inner">
                        {/* Avatar Overlay */}
                        <div className="absolute -bottom-16 left-8 sm:left-12 group cursor-pointer z-10">
                            <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-full bg-neu-bg p-2 shadow-neumorphism relative">
                                <div className="h-full w-full rounded-full overflow-hidden shadow-neumorphism-inset relative">
                                    {formData.profilePicture ? (
                                        <img src={formData.profilePicture} alt="Profile" className="h-full w-full object-cover" />
                                    ) : (
                                        <FaUserCircle className="h-full w-full text-gray-300" />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                                        <FaCamera className="text-white text-3xl drop-shadow-lg" />
                                    </div>
                                </div>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-full"
                                title="Change Profile Picture"
                            />
                        </div>
                    </div>

                    <div className="px-4 sm:px-6">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pl-0 sm:pl-48">
                            <div>
                                <h1 className="text-3xl font-extrabold text-gray-800">{formData.fullName || formData.username}</h1>
                                <p className="text-blue-600 font-bold tracking-wide text-sm mt-1 uppercase">{session?.user?.role}</p>
                            </div>

                            {(session?.user?.role === 'owner' || session?.user?.role === 'admin') && (
                                <Link href="/admin">
                                    <NeuButton className="bg-blue-600 text-white mt-4 sm:mt-0">Go to Admin Dashboard</NeuButton>
                                </Link>
                            )}
                        </div>

                        {success && (
                            <div className="mb-8 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg shadow-sm animate-fade-in-down">
                                <p className="text-green-700 font-medium">{success}</p>
                            </div>
                        )}
                        {error && (
                            <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm animate-fade-in-down">
                                <p className="text-red-700 font-medium">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <NeuInput
                                    label="Full Name"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    icon={<FaUser />}
                                    placeholder="Enter full name"
                                />

                                <NeuInput
                                    label="Username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    icon={<FaUser />}
                                    placeholder="Enter username"
                                />

                                <NeuInput
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    icon={<FaEnvelope />}
                                    placeholder="Enter email"
                                />

                                <NeuInput
                                    label="WhatsApp"
                                    name="whatsapp"
                                    type="tel"
                                    value={formData.whatsapp}
                                    onChange={handleChange}
                                    icon={<FaWhatsapp />}
                                    placeholder="Enter WhatsApp"
                                />

                                <div className="md:col-span-2">
                                    <NeuInput
                                        label="Institution"
                                        name="institution"
                                        value={formData.institution}
                                        readOnly
                                        disabled
                                        icon={<FaUniversity />}
                                        title="Contact admin to change"
                                        placeholder="Not set"
                                    />
                                    <p className="mt-2 text-xs text-gray-400 font-medium ml-1">Contact support to update your institution.</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Bio</label>
                                <textarea
                                    name="bio"
                                    rows={4}
                                    value={formData.bio}
                                    onChange={handleChange}
                                    className="w-full bg-neu-bg rounded-xl border-none outline-none shadow-neumorphism-inset text-gray-700 placeholder-gray-400 p-4 transition-all duration-300 focus:shadow-neumorphism-inset-sm focus:ring-0 resize-none"
                                    placeholder="Tell us about yourself..."
                                />
                            </div>

                            <div className="flex justify-end pt-4">
                                <NeuButton
                                    type="submit"
                                    isLoading={saving}
                                    variant="primary"
                                    className="px-8"
                                >
                                    Save Changes
                                </NeuButton>
                            </div>
                        </form>
                    </div>
                </NeuCard>
            </div>
        </div>
    );
}
