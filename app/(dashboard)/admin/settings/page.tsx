'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { FaUserCog, FaShieldAlt, FaSave, FaCamera } from 'react-icons/fa';
import { NeuButton } from '@/components/ui/NeuButton';
import { NeuInput } from '@/components/ui/NeuInput';
import { NeuCard } from '@/components/ui/NeuCard';

export default function AdminSettingsPage() {
    const { data: session, update: updateSession } = useSession();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        profilePicture: '',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/admin/profile');
            if (res.ok) {
                const data = await res.json();
                setFormData({
                    username: data.username || '',
                    email: data.email || '',
                    profilePicture: data.profilePicture || '',
                });
            }
        } catch (err) {
            setError('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
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
            const res = await fetch('/api/admin/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to update profile');
            }

            // Update session if username changed
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

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/admin/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to update password');
            }

            setSuccess('Password updated successfully');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

            {success && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 text-green-700 rounded-r-lg">
                    {success}
                </div>
            )}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 rounded-r-lg">
                    {error}
                </div>
            )}

            {/* Profile Information */}
            <NeuCard>
                <div className="flex items-center mb-6">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                        <FaUserCog size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Profile Information</h2>
                        <p className="text-sm text-gray-500">Update your account details</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Profile Picture */}
                    <div className="flex items-center space-x-6">
                        <div className="relative group cursor-pointer">
                            <div className="h-20 w-20 rounded-full bg-neu-bg shadow-neumorphism flex items-center justify-center overflow-hidden">
                                {formData.profilePicture ? (
                                    <img src={formData.profilePicture} alt="Profile" className="h-full w-full object-cover" />
                                ) : (
                                    <span className="text-3xl font-bold text-gray-400">
                                        {formData.username?.[0]?.toUpperCase() || 'A'}
                                    </span>
                                )}
                            </div>
                            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <FaCamera className="text-white" />
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-700">Profile Picture</p>
                            <p className="text-xs text-gray-500">Click to upload a new photo</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <NeuInput
                            label="Username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                        <NeuInput
                            label="Email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="flex justify-end">
                        <NeuButton type="submit" isLoading={saving} variant="primary">
                            <FaSave className="mr-2" /> Save Changes
                        </NeuButton>
                    </div>
                </form>
            </NeuCard>

            {/* Password Change */}
            <NeuCard>
                <div className="flex items-center mb-6">
                    <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                        <FaShieldAlt size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Security</h2>
                        <p className="text-sm text-gray-500">Change your password</p>
                    </div>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <NeuInput
                            label="Current Password"
                            name="currentPassword"
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange}
                            required
                        />
                        <NeuInput
                            label="New Password"
                            name="newPassword"
                            type="password"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            placeholder="Min 8 characters"
                            required
                        />
                        <NeuInput
                            label="Confirm Password"
                            name="confirmPassword"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            required
                        />
                    </div>

                    <div className="flex justify-end">
                        <NeuButton type="submit" isLoading={saving} variant="primary">
                            Update Password
                        </NeuButton>
                    </div>
                </form>
            </NeuCard>
        </div>
    );
}
